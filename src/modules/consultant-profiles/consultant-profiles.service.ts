import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { ProfileStatusType, SortOrder } from 'src/enums';
import { ActionType } from 'src/enums/action-type.enum';
import { AuditLogsService } from 'src/modules/audit-logs/audit-logs.service';
import { MailService } from 'src/modules/mail/mail.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { User } from 'src/modules/users/entities/user.entity';
import {
    ArrayContains,
    Between,
    DataSource,
    FindManyOptions,
    FindOptionsWhere,
    ILike,
    IsNull,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
} from 'typeorm';
import { ConsultantScheduleGeneratorService } from './consultant-schedule-generator.service';
import { CreateConsultantProfileDto } from './dto/create-consultant-profile.dto';
import { QueryConsultantProfileDto } from './dto/query-consultant-profile.dto';
import { RejectProfileDto } from './dto/review-profile.dto';
import { UpdateConsultantProfileDto } from './dto/update-consultant-profile.dto';
import { WorkingHours } from './entities/consultant-profile-data.entity';
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
        private readonly auditLogsService: AuditLogsService,
        private readonly dataSource: DataSource,
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
            minConsultationFee,
            maxConsultationFee,
            consultationTypes,
            specialties,
            sortBy = 'createdAt',
            sortOrder = SortOrder.DESC,
        } = queryDto;

        const baseWhere: FindOptionsWhere<ConsultantProfile> = {
            deletedAt: IsNull(),
        };

        if (status) {
            baseWhere.profileStatus = status;
        }

        if (isAvailable !== undefined) {
            baseWhere.isAvailable = isAvailable === 'true';
        }

        if (minRating !== undefined) {
            baseWhere.rating = MoreThanOrEqual(minRating);
        }

        // Xử lý khoảng phí tư vấn hiệu quả
        if (
            minConsultationFee !== undefined &&
            maxConsultationFee !== undefined
        ) {
            baseWhere.consultationFee = Between(
                minConsultationFee,
                maxConsultationFee,
            );
        } else if (minConsultationFee !== undefined) {
            baseWhere.consultationFee = MoreThanOrEqual(minConsultationFee);
        } else if (maxConsultationFee !== undefined) {
            baseWhere.consultationFee = LessThanOrEqual(maxConsultationFee);
        }

        if (consultationTypes) {
            // Giả sử consultationTypes là một trường có kiểu phù hợp
            baseWhere.consultationTypes = consultationTypes;
        }

        if (specialties) {
            const specialtiesArray = specialties
                .split(', ')
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

            if (specialtiesArray.length > 0) {
                baseWhere.specialties = ArrayContains(specialtiesArray);
            }
        }

        // Định kiểu rõ ràng cho finalWhere để nó có thể là một object hoặc một mảng các object
        let finalWhere:
            | FindOptionsWhere<ConsultantProfile>
            | FindOptionsWhere<ConsultantProfile>[];

        if (search) {
            // Nếu có `search`, tạo ra một mảng các điều kiện.
            // TypeORM sẽ nối các điều kiện này bằng OR.
            finalWhere = [
                {
                    ...baseWhere,
                    user: {
                        firstName: ILike(`%${search}%`),
                    },
                },
                {
                    ...baseWhere,
                    user: {
                        lastName: ILike(`%${search}%`),
                    },
                },
            ];
        } else {
            finalWhere = baseWhere;
        }

        const findOptions: FindManyOptions<ConsultantProfile> = {
            relations: {
                user: true,
            },
            where: finalWhere,
        };

        const validSortFields = [
            'rating',
            'consultationFee',
            'createdAt',
            'updatedAt',
        ];
        const orderByField = validSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        findOptions.order = {
            [orderByField]: sortOrder as SortOrder,
        };

        const skip = (page - 1) * limit;
        findOptions.skip = skip;
        findOptions.take = limit;

        const [data, totalItems] =
            await this.profileRepository.findAndCount(findOptions);

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

    async getMyProfile(userId: string): Promise<ConsultantProfile> {
        const profile = await this.profileRepository.findOne({
            where: {
                user: { id: userId },
                deletedAt: IsNull(),
                isVerified: true,
            },
            relations: {
                user: true,
            },
        });

        if (!profile) {
            throw new NotFoundException(
                `Consultant Profile for User ID ${userId} not found.`,
            );
        }

        return profile;
    }

    async updateMyProfile(
        userId: string,
        updateDto: UpdateConsultantProfileDto,
    ): Promise<ConsultantProfile> {
        const profile = await this.profileRepository.findOne({
            where: {
                user: { id: userId },
                deletedAt: IsNull(),
                isVerified: true,
            },
            relations: {
                user: true,
            },
        });

        if (!profile) {
            throw new NotFoundException(
                `Consultant Profile for User ID ${userId} not found.`,
            );
        }

        const updated = this.profileRepository.merge(profile, updateDto);

        return this.profileRepository.save(updated);
    }

    async update(
        id: string,
        updateDto: UpdateConsultantProfileDto,
    ): Promise<ConsultantProfile> {
        const profile = await this.profileRepository.findOneBy({
            id,
        });

        if (!profile) {
            throw new NotFoundException(
                `Consultant Profile with ID ${id} not found.`,
            );
        }

        const updated = this.profileRepository.merge(profile, updateDto);

        return this.profileRepository.save(updated);
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
            relations: {
                user: true,
            },
        });
    }

    async approveProfile(
        id: string,
        adminId: string,
    ): Promise<ConsultantProfile> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const profile = await queryRunner.manager.findOne(
                ConsultantProfile,
                {
                    where: { id },
                    relations: {
                        user: true,
                    },
                },
            );

            if (!profile) {
                throw new NotFoundException('Consultant profile not found.');
            }

            if (profile.profileStatus !== ProfileStatusType.PENDING_APPROVAL) {
                throw new ConflictException(
                    'Only pending profiles can be approved.',
                );
            }

            // Store old values for audit log
            const oldValues = {
                profileStatus: profile.profileStatus,
                verifiedAt: profile.verifiedAt,
            };

            // Update profile status
            profile.profileStatus = ProfileStatusType.ACTIVE;
            profile.verifiedAt = new Date();
            const updatedProfile = await queryRunner.manager.save(
                ConsultantProfile,
                profile,
            );

            // Create audit log
            await this.auditLogsService.create({
                userId: adminId,
                action: ActionType.UPDATE,
                entityType: 'ConsultantProfile',
                entityId: profile.id,
                oldValues,
                newValues: {
                    profileStatus: profile.profileStatus,
                    verifiedAt: profile.verifiedAt,
                },
                details: `Consultant profile approved for user ${profile.user.firstName} ${profile.user.lastName}`,
            });

            // Send email notification
            const { user } = updatedProfile;
            const userName = `${user.firstName} ${user.lastName}`;
            await this.mailService.sendConsultantApprovalEmail(
                user.email,
                userName,
            );

            // Create in-app notification
            await this.notificationsService.create({
                userId: user.id,
                title: 'Hồ sơ đã được duyệt',
                content:
                    'Chúc mừng! Hồ sơ tư vấn viên của bạn đã được phê duyệt.',
                type: 'PROFILE_APPROVED',
            });

            await queryRunner.commitTransaction();
            return updatedProfile;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async rejectProfile(
        id: string,
        rejectDto: RejectProfileDto,
        adminId: string,
    ): Promise<ConsultantProfile> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const profile = await queryRunner.manager.findOne(
                ConsultantProfile,
                {
                    where: { id },
                    relations: {
                        user: true,
                    },
                },
            );

            if (!profile) {
                throw new NotFoundException('Consultant profile not found.');
            }

            if (profile.profileStatus !== ProfileStatusType.PENDING_APPROVAL) {
                throw new ConflictException(
                    'Only pending profiles can be rejected.',
                );
            }

            // Store old values for audit log
            const oldValues = {
                profileStatus: profile.profileStatus,
                rejectionReason: profile.rejectionReason,
            };

            // Update profile status
            profile.profileStatus = ProfileStatusType.REJECTED;
            profile.rejectionReason = rejectDto.reason;
            const updatedProfile = await queryRunner.manager.save(
                ConsultantProfile,
                profile,
            );

            // Create audit log
            await this.auditLogsService.create({
                userId: adminId,
                action: ActionType.UPDATE,
                entityType: 'ConsultantProfile',
                entityId: profile.id,
                oldValues,
                newValues: {
                    profileStatus: profile.profileStatus,
                    rejectionReason: profile.rejectionReason,
                },
                details: `Consultant profile rejected for user ${profile.user.firstName} ${profile.user.lastName}. Reason: ${rejectDto.reason}`,
            });

            // Send email notification
            const { user } = updatedProfile;
            const userName = `${user.firstName} ${user.lastName}`;
            await this.mailService.sendConsultantRejectionEmail(
                user.email,
                userName,
                rejectDto.reason,
            );

            // Create in-app notification
            await this.notificationsService.create({
                userId: user.id,
                title: 'Hồ sơ bị từ chối',
                content: `Rất tiếc, hồ sơ của bạn đã bị từ chối với lý do: ${rejectDto.reason}`,
                type: 'PROFILE_REJECTED',
            });

            await queryRunner.commitTransaction();
            return updatedProfile;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Cập nhật workingHours và tự động tạo lịch khả dụng
     */
    async updateWorkingHoursAndGenerateSchedule(
        id: string,
        workingHours: WorkingHours,
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
