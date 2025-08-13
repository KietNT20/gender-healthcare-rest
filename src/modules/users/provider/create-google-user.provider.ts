import { ConflictException, Injectable } from '@nestjs/common';
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
                    push: true,
                    email: true,
                },
                healthDataConsent: false,
            });

            return await this.usersRepository.save(user);
        } catch (error: any) {
            // Handle database constraint violations
            if (error.code === '23505') {
                // PostgreSQL unique constraint violation
                if (String(error.constraint || '').includes('email')) {
                    throw new ConflictException('Email already exists');
                }
                if (String(error.constraint || '').includes('google_id')) {
                    throw new ConflictException(
                        'Google account already linked',
                    );
                }
                // Generic unique constraint violation
                throw new ConflictException(
                    'User with this information already exists',
                );
            }

            // Handle other database errors
            if (error.code && String(error.code).startsWith('23')) {
                throw new ConflictException('Database constraint violation');
            }

            // Re-throw the original error for other cases
            throw error;
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
        // Create a base slug from the user's name and email
        const userSlug = `${googleUser.firstName || 'User'} ${googleUser.lastName || 'Google'} ${googleUser.email}`;
        const baseSlug = slugify(userSlug, {
            lower: true,
            strict: true,
        });

        // Append a UUID to ensure uniqueness
        const slugWithUuid = `${baseSlug}-${uuidv4().substring(0, 8)}`;

        // Check if the slug already exists
        const existingUser = await this.usersRepository.findOne({
            where: { slug: slugWithUuid },
        });

        if (existingUser) {
            // If slug already exists, generate a new one
            return `${baseSlug}-${uuidv4().substring(0, 8)}`;
        }

        return slugWithUuid;
    }

    async findExistingGoogleUser(
        googleId: string,
        email: string,
    ): Promise<User | null> {
        // Find user by googleId first
        let user = await this.usersRepository.findOne({
            where: { googleId },
            relations: {
                role: true,
            },
        });

        if (!user) {
            // Find by email if googleId not found
            user = await this.usersRepository.findOne({
                where: { email: email.toLowerCase() },
                relations: {
                    role: true,
                },
            });
        }

        if (!user) {
            return null;
        }

        return user;
    }

    /**
     * Link Google account to an existing user or create a new user if not found
     * @param userId
     * @param googleId
     * @param profilePicture
     * @returns User
     * @throws ConflictException if user not found or already linked
     */
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
            relations: {
                role: true,
            },
        });

        if (!updatedUser) {
            throw new ConflictException('User not found after update');
        }

        return updatedUser;
    }
}
