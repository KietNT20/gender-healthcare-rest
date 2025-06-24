import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { RolesNameEnum } from 'src/enums';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../entities/user.entity';
import { GoogleUser } from '../interfaces/google-user.interface';

@Injectable()
export class CreateGoogleUserProvider {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,
    ) {}

    async createGoogleUser(googleUser: GoogleUser): Promise<User> {
        try {
            const customerRole = await this.getDefaultRole();

            const slug = await this.generateUniqueSlug(googleUser);

            const user = this.usersRepository.create({
                firstName: googleUser.firstName,
                lastName: googleUser.lastName,
                email: googleUser.email.toLowerCase(),
                googleId: googleUser.googleId,
                slug: slug,
                role: customerRole,
                profilePicture: googleUser.profilePicture,
                emailVerified: true,
                isActive: true,
                locale: 'vi',
                notificationPreferences: {
                    sms: false,
                    push: true,
                    email: true,
                },
                healthDataConsent: false,
            });

            return await this.usersRepository.save(user);
        } catch (error) {
            if (error.code === '23505') {
                if (error.detail?.includes('email')) {
                    throw new ConflictException('Email already exists');
                }
                if (error.detail?.includes('slug')) {
                    throw new ConflictException('Username already exists');
                }
            }
            throw new ConflictException('Could not create user', {
                description: error.message,
            });
        }
    }

    private async getDefaultRole(): Promise<Role> {
        const customerRole = await this.rolesRepository.findOne({
            where: { name: RolesNameEnum.CUSTOMER },
        });

        if (!customerRole) {
            throw new ConflictException('Default customer role not found');
        }

        return customerRole;
    }

    private async generateUniqueSlug(googleUser: GoogleUser): Promise<string> {
        // Tạo slug từ tên và email
        const userSlug = `${googleUser.firstName || 'User'} ${googleUser.lastName || 'Google'} ${googleUser.email}`;
        const baseSlug = slugify(userSlug, {
            lower: true,
            strict: true,
        });

        // Thêm UUID ngắn để đảm bảo unique
        const slugWithUuid = `${baseSlug}-${uuidv4().substring(0, 8)}`;

        // Kiểm tra nếu slug đã tồn tại (optional, vì đã có UUID)
        const existingUser = await this.usersRepository.findOne({
            where: { slug: slugWithUuid },
        });

        if (existingUser) {
            // Nếu trùng (rất hiếm), tạo lại với UUID mới
            return `${baseSlug}-${uuidv4().substring(0, 8)}`;
        }

        return slugWithUuid;
    }

    // Method hỗ trợ kiểm tra user đã tồn tại
    async findExistingGoogleUser(
        googleId: string,
        email: string,
    ): Promise<User> {
        // Tìm theo googleId trước
        let user = await this.usersRepository.findOne({
            where: { googleId },
            relations: ['role'],
        });

        if (!user) {
            // Tìm theo email nếu không có googleId
            user = await this.usersRepository.findOne({
                where: { email: email.toLowerCase() },
                relations: ['role'],
            });
        }

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        return user;
    }

    // Method cập nhật thông tin Google cho user hiện có
    async linkGoogleAccount(
        userId: string,
        googleId: string,
        profilePicture?: string,
    ): Promise<User> {
        const updateData: Partial<User> = { googleId };

        if (profilePicture) {
            updateData.profilePicture = profilePicture;
        }

        await this.usersRepository.update(userId, updateData);

        const updatedUser = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });

        if (!updatedUser) {
            throw new ConflictException('User not found after update');
        }

        return updatedUser;
    }
}
