import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileStatusType } from 'src/enums';
import { IsNull, Repository } from 'typeorm';
import { ConsultantScheduleGeneratorService } from './consultant-schedule-generator.service';
import { ConsultantProfile } from './entities/consultant-profile.entity';

@Injectable()
export class ConsultantScheduleCronService {
    private readonly logger = new Logger(ConsultantScheduleCronService.name);

    constructor(
        @InjectRepository(ConsultantProfile)
        private readonly profileRepository: Repository<ConsultantProfile>,
        private readonly scheduleGeneratorService: ConsultantScheduleGeneratorService,
    ) {}

    /**
     * Chạy hàng ngày lúc 2:00 AM để đảm bảo các consultant luôn có lịch cho 4 tuần tới
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async ensureUpcomingSchedulesForAllConsultants(): Promise<void> {
        this.logger.log(
            'Bắt đầu job tự động tạo lịch cho tất cả consultant...',
        );

        try {
            // Lấy tất cả consultant profile đang active và có workingHours
            const activeProfiles = await this.profileRepository.find({
                where: {
                    profileStatus: ProfileStatusType.ACTIVE,
                    isAvailable: true,
                    deletedAt: IsNull(),
                },
                select: ['id', 'workingHours'],
            });

            this.logger.log(
                `Tìm thấy ${activeProfiles.length} consultant đang hoạt động`,
            );

            let successCount = 0;
            let errorCount = 0;

            // Xử lý từng consultant
            for (const profile of activeProfiles) {
                if (profile.workingHours) {
                    try {
                        await this.scheduleGeneratorService.ensureUpcomingWeeksAvailability(
                            profile,
                            4, // 4 tuần
                        );
                        successCount++;
                    } catch (error) {
                        this.logger.error(
                            `Lỗi khi tạo lịch cho consultant ${profile.id}: ${error.message}`,
                        );
                        errorCount++;
                    }
                } else {
                    this.logger.debug(
                        `Consultant ${profile.id} chưa thiết lập workingHours, bỏ qua`,
                    );
                }
            }

            this.logger.log(
                `Hoàn thành job tạo lịch: ${successCount} thành công, ${errorCount} lỗi`,
            );
        } catch (error) {
            this.logger.error(
                `Lỗi trong job tự động tạo lịch: ${error.message}`,
                error.stack,
            );
        }
    } /**
     * Chạy hàng tuần vào Chủ nhật lúc 1:00 AM để dọn dẹp lịch cũ
     */
    @Cron('0 1 * * 0') // Chủ nhật lúc 1:00 AM
    async cleanupOldSchedules(): Promise<void> {
        this.logger.log('Bắt đầu job dọn dẹp lịch cũ...');

        try {
            // Tính toán ngày cách đây 1 tháng
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            // Lấy tất cả consultant profiles
            const allProfiles = await this.profileRepository.find({
                where: {
                    deletedAt: IsNull(),
                },
                select: ['id'],
            });

            let cleanedCount = 0;

            for (const profile of allProfiles) {
                try {
                    const result = await this.scheduleGeneratorService[
                        'availabilityRepository'
                    ]
                        .createQueryBuilder()
                        .softDelete()
                        .where('consultantProfile.id = :profileId', {
                            profileId: profile.id,
                        })
                        .andWhere('specificDate < :cutoffDate', {
                            cutoffDate: oneMonthAgo,
                        })
                        .andWhere('deletedAt IS NULL')
                        .execute();

                    if (result.affected && result.affected > 0) {
                        cleanedCount += result.affected;
                    }
                } catch (error) {
                    this.logger.error(
                        `Lỗi khi dọn dẹp lịch cho consultant ${profile.id}: ${error.message}`,
                    );
                }
            }

            this.logger.log(`Đã dọn dẹp ${cleanedCount} lịch cũ`);
        } catch (error) {
            this.logger.error(
                `Lỗi trong job dọn dẹp lịch cũ: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Kiểm tra và cập nhật lịch cho consultant cụ thể (có thể gọi thủ công)
     */
    async refreshScheduleForConsultant(consultantId: string): Promise<void> {
        try {
            const profile = await this.profileRepository.findOne({
                where: { id: consultantId, deletedAt: IsNull() },
            });

            if (!profile) {
                throw new NotFoundException(
                    `Không tìm thấy consultant với ID: ${consultantId}`,
                );
            }

            if (!profile.workingHours) {
                throw new NotFoundException(
                    `Consultant ${consultantId} chưa thiết lập workingHours`,
                );
            }

            await this.scheduleGeneratorService.regenerateAvailabilityFromWorkingHours(
                profile,
                4,
            );

            this.logger.log(`Đã làm mới lịch cho consultant ${consultantId}`);
        } catch (error) {
            this.logger.error(
                `Lỗi khi làm mới lịch cho consultant ${consultantId}: ${error.message}`,
            );
            throw error;
        }
    }
}
