import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { ProfileStatusType } from 'src/enums';
import { MailService } from 'src/modules/mail/mail.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { User } from 'src/modules/users/entities/user.entity';
import { IsNull, Repository } from 'typeorm';
import { ConsultantScheduleGeneratorService } from './consultant-schedule-generator.service';
import { CreateConsultantProfileDto } from './dto/create-consultant-profile.dto';
import { QueryConsultantProfileDto } from './dto/query-consultant-profile.dto';
import { RejectProfileDto } from './dto/review-profile.dto';
import { UpdateConsultantProfileDto } from './dto/update-consultant-profile.dto';
import { ConsultantProfile } from './entities/consultant-profile.entity';

@Injectable()
export class ConsultantProfilesService {
    constructor(
        @InjectRepository(ConsultantProfile)
        private readonly profileRepository: Repository<ConsultantProfile>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly mailService: MailService,
        private readonly notificationsService: NotificationsService,
        private readonly scheduleGeneratorService: ConsultantScheduleGeneratorService,
    ) {}

    async create(
        createDto: CreateConsultantProfileDto,
    ): Promise<ConsultantProfile> {
        const { userId } = createDto;

        // Kiểm tra user có tồn tại không
        const user = await this.userRepository.findOneBy({
            id: userId,
            deletedAt: IsNull(),
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found.`);
        }

        // Kiểm tra user đã có profile chưa
        const existingProfile = await this.profileRepository.findOne({
            where: { user: { id: userId } },
        });
        if (existingProfile) {
            throw new ConflictException(
                `User with ID ${userId} already has a consultant profile.`,
            );
        }

        const newProfile = this.profileRepository.create({
            ...createDto,
            user,
        });

        return this.profileRepository.save(newProfile);
    }

    async findAll(
        queryDto: QueryConsultantProfileDto,
    ): Promise<Paginated<ConsultantProfile>> {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            isAvailable,
            minRating,
            specialties,
            sortBy,
            sortOrder,
        } = queryDto;

        const queryBuilder = this.profileRepository
            .createQueryBuilder('profile')
            .leftJoinAndSelect('profile.user', 'user')
            .where('profile.deletedAt IS NULL');

        if (search) {
            queryBuilder.andWhere(
                '(user.firstName ILIKE :search OR user.lastName ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        if (status) {
            queryBuilder.andWhere('profile.profileStatus = :status', {
                status,
            });
        }

        if (isAvailable !== undefined) {
            queryBuilder.andWhere('profile.isAvailable = :isAvailable', {
                isAvailable,
            });
        }

        if (minRating) {
            queryBuilder.andWhere('profile.rating >= :minRating', {
                minRating,
            });
        }

        if (specialties) {
            const specialtiesArray = specialties
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

            if (specialtiesArray.length > 0) {
                queryBuilder.andWhere(
                    'profile.specialties && ARRAY[:...specialtiesArray]',
                    { specialtiesArray },
                );
            }
        }

        const validSortFields = ['rating', 'consultationFee', 'createdAt'];
        const orderBy = validSortFields.includes(sortBy)
            ? `profile.${sortBy}`
            : 'profile.createdAt';
        queryBuilder.orderBy(orderBy, sortOrder);

        const skip = (page - 1) * limit;
        const [data, totalItems] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            meta: {
                itemsPerPage: limit,
                totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
            },
        };
    }

    async findOne(id: string): Promise<ConsultantProfile> {
        const profile = await this.profileRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                user: true,
                documents: true,
            },
        });
        if (!profile) {
            throw new NotFoundException(
                `Consultant Profile with ID ${id} not found.`,
            );
        }
        return profile;
    }

    async update(
        id: string,
        updateDto: UpdateConsultantProfileDto,
    ): Promise<ConsultantProfile> {
        const profile = await this.profileRepository.preload({
            id,
            ...updateDto,
        });

        if (!profile) {
            throw new NotFoundException(
                `Consultant Profile with ID ${id} not found.`,
            );
        }

        return this.profileRepository.save(profile);
    }

    async remove(id: string): Promise<void> {
        const result = await this.profileRepository.softDelete(id);
        if (result.affected === 0) {
            throw new NotFoundException(
                `Consultant Profile with ID ${id} not found.`,
            );
        }
    }

    // Các hàm approve/reject đã được tạo ở các bước trước đó
    async findPendingProfiles(): Promise<ConsultantProfile[]> {
        return this.profileRepository.find({
            where: { profileStatus: ProfileStatusType.PENDING_APPROVAL },
            relations: ['user'],
        });
    }

    async approveProfile(
        id: string,
        adminId: string,
    ): Promise<ConsultantProfile> {
        const profile = await this.profileRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (
            !profile ||
            profile.profileStatus !== ProfileStatusType.PENDING_APPROVAL
        ) {
            throw new NotFoundException('Pending profile not found.');
        }

        profile.profileStatus = ProfileStatusType.ACTIVE;
        profile.verifiedAt = new Date();
        const updatedProfile = await this.profileRepository.save(profile);

        const { user } = updatedProfile;
        const userName = `${user.firstName} ${user.lastName}`;
        await this.mailService.sendConsultantApprovalEmail(
            user.email,
            userName,
        );
        await this.notificationsService.create({
            userId: user.id,
            title: 'Hồ sơ đã được duyệt',
            content: 'Chúc mừng! Hồ sơ tư vấn viên của bạn đã được phê duyệt.',
            type: 'PROFILE_APPROVED',
        });

        return updatedProfile;
    }

    async rejectProfile(
        id: string,
        rejectDto: RejectProfileDto,
        adminId: string,
    ): Promise<ConsultantProfile> {
        const profile = await this.profileRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (
            !profile ||
            profile.profileStatus !== ProfileStatusType.PENDING_APPROVAL
        ) {
            throw new NotFoundException('Pending profile not found.');
        }

        profile.profileStatus = ProfileStatusType.REJECTED;
        profile.rejectionReason = rejectDto.reason;
        const updatedProfile = await this.profileRepository.save(profile);

        const { user } = updatedProfile;
        const userName = `${user.firstName} ${user.lastName}`;
        await this.mailService.sendConsultantRejectionEmail(
            user.email,
            userName,
            rejectDto.reason,
        );
        await this.notificationsService.create({
            userId: user.id,
            title: 'Hồ sơ bị từ chối',
            content: `Rất tiếc, hồ sơ của bạn đã bị từ chối với lý do: ${rejectDto.reason}`,
            type: 'PROFILE_REJECTED',
        });

        return updatedProfile;
    }

    /**
     * Cập nhật workingHours và tự động tạo lịch khả dụng
     */
    async updateWorkingHoursAndGenerateSchedule(
        id: string,
        workingHours: any,
        weeksToGenerate: number = 4,
    ): Promise<ConsultantProfile> {
        const profile = await this.findOne(id);

        // Cập nhật workingHours
        profile.workingHours = workingHours;
        const updatedProfile = await this.profileRepository.save(profile);

        // Tự động tạo lịch khả dụng
        try {
            await this.scheduleGeneratorService.regenerateAvailabilityFromWorkingHours(
                updatedProfile,
                weeksToGenerate,
            );
        } catch (error) {
            console.error('Lỗi khi tạo lịch tự động:', error);
            // Không throw error để không ảnh hưởng đến việc cập nhật workingHours
        }

        return updatedProfile;
    }

    /**
     * Tự động tạo lịch khả dụng từ workingHours hiện tại
     */
    async generateScheduleFromWorkingHours(
        id: string,
        weeksToGenerate: number = 4,
    ): Promise<void> {
        const profile = await this.findOne(id);

        if (!profile.workingHours) {
            throw new ConflictException(
                'Consultant chưa thiết lập workingHours',
            );
        }

        await this.scheduleGeneratorService.generateAvailabilityFromWorkingHours(
            profile,
            weeksToGenerate,
        );
    }

    /**
     * Đảm bảo luôn có lịch cho 4 tuần tới
     */
    async ensureUpcomingSchedule(id: string): Promise<void> {
        const profile = await this.findOne(id);

        if (profile.workingHours) {
            await this.scheduleGeneratorService.ensureUpcomingWeeksAvailability(
                profile,
            );
        }
    }
}
