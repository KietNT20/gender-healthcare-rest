import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    AppointmentStatusType,
    ConsultantSelectionType,
    ProfileStatusType,
    RolesNameEnum,
} from 'src/enums';
import { EntityManager, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ConsultantAvailability } from '../consultant-availability/entities/consultant-availability.entity';
import { ConsultantProfile } from '../consultant-profiles/entities/consultant-profile.entity';
import { Service } from '../services/entities/service.entity';
import { Appointment } from './entities/appointment.entity';

/**
 * @class AppointmentBookingService
 * @description Xử lý logic phức tạp của việc tìm kiếm, xác thực và
 * phân công tư vấn viên cho một cuộc hẹn.
 */
@Injectable()
export class AppointmentBookingService {
    /**
     * Tìm và xác thực một suất tư vấn dựa trên yêu cầu của người dùng (chọn thủ công hoặc tự động).
     * @param consultantId - ID của tư vấn viên (nếu người dùng chọn thủ công).
     * @param appointmentDate - Ngày giờ của cuộc hẹn.
     * @param services - Danh sách dịch vụ được yêu cầu.
     * @param manager - EntityManager để thực hiện các truy vấn trong cùng một transaction.
     * @returns Thông tin về tư vấn viên, suất khám có sẵn và loại lựa chọn.
     */
    async findAndValidateSlotForConsultation(
        consultantId: string | undefined,
        appointmentDate: Date,
        services: Service[],
        manager: EntityManager,
    ) {
        const dayOfWeek = appointmentDate.getDay();
        const time = appointmentDate.toTimeString().substring(0, 5);

        if (consultantId) {
            // Kịch bản 1: Người dùng chọn tư vấn viên
            const { consultant, availability } =
                await this.findManualConsultantSlot(
                    consultantId,
                    dayOfWeek,
                    time,
                    appointmentDate,
                    manager,
                );
            return {
                consultant,
                availability,
                selectionType: ConsultantSelectionType.MANUAL,
            };
        } else {
            // Kịch bản 2: Hệ thống tự động tìm tư vấn viên phù hợp
            const serviceSpecialties = services.flatMap(
                (s) => s.specialties || [],
            );
            const { consultant, availability } =
                await this.findAutoAssignedConsultant(
                    serviceSpecialties,
                    dayOfWeek,
                    time,
                    appointmentDate,
                    manager,
                );
            return {
                consultant,
                availability,
                selectionType: ConsultantSelectionType.AUTOMATIC,
            };
        }
    }

    /**
     * Tìm và xác thực suất khám khi người dùng đã chọn một tư vấn viên cụ thể.
     */
    private async findManualConsultantSlot(
        consultantId: string,
        dayOfWeek: number,
        time: string,
        date: Date,
        manager: EntityManager,
    ) {
        const profile = await manager.findOne(ConsultantProfile, {
            where: { user: { id: consultantId } },
            relations: ['user', 'user.role'],
        });

        if (!profile || profile.user.role.name !== RolesNameEnum.CONSULTANT) {
            throw new NotFoundException('Tư vấn viên không hợp lệ.');
        }

        const availability = await this.findAvailableSlotForConsultant(
            profile.id,
            dayOfWeek,
            time,
            date,
            manager,
        );

        if (!availability) {
            throw new BadRequestException(
                'Tư vấn viên không có lịch trống vào thời gian này.',
            );
        }

        return { consultant: profile.user, availability };
    }

    /**
     * Tự động tìm một tư vấn viên phù hợp dựa trên chuyên môn và có lịch trống.
     */
    private async findAutoAssignedConsultant(
        specialties: string[],
        dayOfWeek: number,
        time: string,
        date: Date,
        manager: EntityManager,
    ) {
        const profiles = await manager.find(ConsultantProfile, {
            where: {
                profileStatus: ProfileStatusType.ACTIVE, // FIX: Sử dụng enum thay vì string
                specialties: In(specialties),
            },
            relations: ['user', 'user.role'],
        });

        if (profiles.length === 0) {
            throw new NotFoundException(
                'Không tìm thấy tư vấn viên nào có chuyên môn phù hợp.',
            );
        }

        for (const profile of profiles) {
            const availability = await this.findAvailableSlotForConsultant(
                profile.id,
                dayOfWeek,
                time,
                date,
                manager,
            );
            if (availability) {
                return { consultant: profile.user, availability };
            }
        }

        throw new NotFoundException(
            'Tất cả tư vấn viên phù hợp đều đã kín lịch vào thời gian này.',
        );
    }

    /**
     * Kiểm tra và trả về một suất khám trống của một tư vấn viên cụ thể.
     */
    private async findAvailableSlotForConsultant(
        profileId: string,
        dayOfWeek: number,
        time: string,
        date: Date,
        manager: EntityManager,
    ): Promise<ConsultantAvailability | null> {
        const availability = await manager.findOne(ConsultantAvailability, {
            where: {
                consultantProfile: { id: profileId },
                dayOfWeek,
                startTime: LessThanOrEqual(time),
                endTime: MoreThanOrEqual(time),
                isAvailable: true,
            },
        });

        if (!availability) {
            return null;
        }

        const existingCount = await manager.count(Appointment, {
            where: {
                consultantAvailability: { id: availability.id },
                appointmentDate: date,
                status: In([
                    AppointmentStatusType.CONFIRMED,
                    AppointmentStatusType.PENDING,
                ]),
            },
        });

        return existingCount >= availability.maxAppointments
            ? null
            : availability;
    }
}
