import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ConsultantAvailability } from '../consultant-availability/entities/consultant-availability.entity';
import {
    DayWorkingHours,
    WorkingHours,
} from './entities/consultant-profile-data.entity';
import { ConsultantProfile } from './entities/consultant-profile.entity';

@Injectable()
export class ConsultantScheduleGeneratorService {
    private readonly logger = new Logger(
        ConsultantScheduleGeneratorService.name,
    );

    constructor(
        @InjectRepository(ConsultantAvailability)
        private readonly availabilityRepository: Repository<ConsultantAvailability>,
    ) {}

    /**
     * Tự động tạo lịch khả dụng cho 4 tuần tiếp theo dựa trên workingHours
     */
    async generateAvailabilityFromWorkingHours(
        consultantProfile: ConsultantProfile,
        weeksToGenerate: number = 4,
    ): Promise<ConsultantAvailability[]> {
        if (!consultantProfile.workingHours) {
            throw new BadRequestException(
                'Tư vấn viên chưa thiết lập giờ làm việc',
            );
        }

        const workingHours = consultantProfile.workingHours;
        const createdAvailabilities: ConsultantAvailability[] = [];

        // Lấy ngày bắt đầu (thứ 2 tuần tiếp theo)
        const startDate = this.getNextMonday();

        // Tạo lịch cho từng tuần
        for (let week = 0; week < weeksToGenerate; week++) {
            const weekAvailabilities = await this.generateWeekAvailability(
                consultantProfile,
                workingHours,
                startDate,
                week,
            );
            createdAvailabilities.push(...weekAvailabilities);
        }

        this.logger.log(
            `Đã tạo ${createdAvailabilities.length} lịch khả dụng cho consultant ${consultantProfile.id}`,
        );

        return createdAvailabilities;
    }

    /**
     * Tạo lịch cho một tuần cụ thể
     */
    private async generateWeekAvailability(
        consultantProfile: ConsultantProfile,
        workingHours: WorkingHours,
        startDate: Date,
        weekOffset: number,
    ): Promise<ConsultantAvailability[]> {
        const weekAvailabilities: ConsultantAvailability[] = [];
        const daysOfWeek = [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
        ];

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const dayName = daysOfWeek[dayIndex] as keyof WorkingHours;
            const dayWorkingHours = workingHours[dayName];

            if (dayWorkingHours && Array.isArray(dayWorkingHours)) {
                const currentDate = new Date(startDate);
                currentDate.setDate(
                    startDate.getDate() + weekOffset * 7 + dayIndex,
                ); // Kiểm tra xem đã có lịch cho ngày này chưa
                const existingAvailability =
                    await this.availabilityRepository.findOne({
                        where: {
                            consultantProfile: { id: consultantProfile.id },
                            specificDate: currentDate,
                            deletedAt: IsNull(),
                        },
                    });

                if (existingAvailability) {
                    this.logger.debug(
                        `Lịch cho ngày ${currentDate.toISOString().split('T')[0]} đã tồn tại, bỏ qua`,
                    );
                    continue;
                }

                // Tạo availability cho từng time slot trong ngày
                for (const timeSlot of dayWorkingHours) {
                    if (timeSlot.isAvailable) {
                        const availability = await this.createAvailabilitySlot(
                            consultantProfile,
                            currentDate,
                            dayIndex + 1, // dayOfWeek bắt đầu từ 1 (Monday = 1)
                            timeSlot,
                        );

                        if (availability) {
                            weekAvailabilities.push(availability);
                        }
                    }
                }
            }
        }

        return weekAvailabilities;
    }

    /**
     * Tạo một slot khả dụng cụ thể
     */
    private async createAvailabilitySlot(
        consultantProfile: ConsultantProfile,
        date: Date,
        dayOfWeek: number,
        timeSlot: DayWorkingHours,
    ): Promise<ConsultantAvailability> {
        try {
            const availability = this.availabilityRepository.create({
                consultantProfile,
                dayOfWeek,
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                isAvailable: timeSlot.isAvailable,
                maxAppointments: timeSlot.maxAppointments || 1,
                recurring: false, // Đặt false vì đây là lịch cụ thể theo ngày
                specificDate: date,
            });

            return await this.availabilityRepository.save(availability);
        } catch (error) {
            this.logger.error(
                `Lỗi khi tạo availability slot cho ngày ${date.toISOString().split('T')[0]} từ ${timeSlot.startTime} đến ${timeSlot.endTime}: ${error.message}`,
            );
            throw new InternalServerErrorException();
        }
    }

    /**
     * Lấy ngày thứ 2 của tuần tiếp theo
     */
    private getNextMonday(): Date {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilNextMonday);
        nextMonday.setHours(0, 0, 0, 0);

        return nextMonday;
    }

    /**
     * Xóa lịch khả dụng cũ và tạo lại từ workingHours
     */
    async regenerateAvailabilityFromWorkingHours(
        consultantProfile: ConsultantProfile,
        weeksToGenerate: number = 4,
    ): Promise<ConsultantAvailability[]> {
        // Xóa các lịch khả dụng trong tương lai chưa có appointment
        await this.clearFutureAvailability(consultantProfile);

        // Tạo lại lịch mới
        return this.generateAvailabilityFromWorkingHours(
            consultantProfile,
            weeksToGenerate,
        );
    }

    /**
     * Xóa các lịch khả dụng trong tương lai chưa có appointment
     */
    private async clearFutureAvailability(
        consultantProfile: ConsultantProfile,
    ): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await this.availabilityRepository
            .createQueryBuilder()
            .softDelete()
            .where('consultantProfile.id = :profileId', {
                profileId: consultantProfile.id,
            })
            .andWhere('specificDate >= :today', { today })
            .andWhere(
                'id NOT IN (SELECT DISTINCT consultantAvailabilityId FROM appointment WHERE consultantAvailabilityId IS NOT NULL)',
            )
            .execute();

        this.logger.log(
            `Đã xóa lịch khả dụng cũ cho consultant ${consultantProfile.id}`,
        );
    }

    /**
     * Kiểm tra và tạo lịch cho tuần tiếp theo nếu cần
     */
    async ensureUpcomingWeeksAvailability(
        consultantProfile: ConsultantProfile,
        weeksAhead: number = 4,
    ): Promise<void> {
        if (!consultantProfile.workingHours) {
            return;
        }

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + weeksAhead * 7); // Kiểm tra xem có lịch cho tuần cuối cùng không
        const existingFutureAvailability =
            await this.availabilityRepository.findOne({
                where: {
                    consultantProfile: { id: consultantProfile.id },
                    specificDate: futureDate,
                    deletedAt: IsNull(),
                },
            });

        if (!existingFutureAvailability) {
            this.logger.log(
                `Tạo thêm lịch cho consultant ${consultantProfile.id}`,
            );
            await this.generateAvailabilityFromWorkingHours(
                consultantProfile,
                1,
            );
        }
    }
}
