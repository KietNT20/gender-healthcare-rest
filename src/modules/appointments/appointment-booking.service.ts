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
import {
    EntityManager,
    FindOptionsWhere,
    In,
    LessThanOrEqual,
    MoreThanOrEqual,
} from 'typeorm';
import { ConsultantAvailability } from '../consultant-availability/entities/consultant-availability.entity';
import { ConsultantProfile } from '../consultant-profiles/entities/consultant-profile.entity';
import { Service } from '../services/entities/service.entity';
import {
    AvailableSlotDto,
    FindAvailableSlotsDto,
    FindAvailableSlotsResponseDto,
} from './dto/find-available-slots.dto';
import { Appointment } from './entities/appointment.entity';

/**
 * @class AppointmentBookingService
 * @description Xử lý logic phức tạp của việc tìm kiếm, xác thực và
 * phân công tư vấn viên cho một cuộc hẹn.
 */
@Injectable()
export class AppointmentBookingService {
    /**
     * Tìm và xác thực một suất tư vấn dựa trên tư vấn viên được chọn từ available slots.
     * @param consultantId - ID của tư vấn viên được chọn.
     * @param appointmentDate - Ngày giờ của cuộc hẹn.
     * @param services - Danh sách dịch vụ được yêu cầu.
     * @param manager - EntityManager để thực hiện các truy vấn trong cùng một transaction.
     * @returns Thông tin về tư vấn viên và suất khám có sẵn.
     */
    async findAndValidateSlotForConsultation(
        consultantId: string,
        appointmentDate: Date,
        services: Service[],
        manager: EntityManager,
    ) {
        const dayOfWeek = appointmentDate.getDay();
        const time = appointmentDate.toTimeString().substring(0, 5);

        // Tìm và validate slot cho tư vấn viên được chọn
        const { consultant, availability } =
            await this.findManualConsultantSlot(
                consultantId,
                dayOfWeek,
                time,
                appointmentDate,
                manager,
                services,
            );

        return {
            consultant,
            availability,
            selectionType: ConsultantSelectionType.MANUAL,
        };
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
        services: Service[],
    ) {
        const profile = await manager.findOne(ConsultantProfile, {
            where: { user: { id: consultantId } },
            relations: {
                user: {
                    role: true,
                },
            },
        });

        if (!profile || profile.user.role.name !== RolesNameEnum.CONSULTANT) {
            throw new NotFoundException('Tư vấn viên không hợp lệ.');
        }

        // Kiểm tra trạng thái profile
        if (profile.profileStatus !== ProfileStatusType.ACTIVE) {
            throw new BadRequestException(
                'Tư vấn viên này hiện không hoạt động.',
            );
        }

        // Kiểm tra chuyên môn của tư vấn viên có phù hợp với dịch vụ yêu cầu tư vấn không
        const consultationServices = services.filter(
            (service) => service.requiresConsultant === true,
        );

        if (consultationServices.length > 0) {
            const serviceSpecialties = consultationServices.flatMap(
                (service) => service.specialties || [],
            );

            if (serviceSpecialties.length > 0) {
                const consultantSpecialties = profile.specialties || [];
                const hasMatchingSpecialty = serviceSpecialties.some(
                    (serviceSpecialty) =>
                        consultantSpecialties.includes(serviceSpecialty),
                );

                if (!hasMatchingSpecialty) {
                    const requiredSpecialties = [
                        ...new Set(serviceSpecialties),
                    ].join(', ');
                    const consultantSpecialtiesStr =
                        consultantSpecialties.length > 0
                            ? consultantSpecialties.join(', ')
                            : 'Không có chuyên môn nào';

                    throw new BadRequestException(
                        `Tư vấn viên "${profile.user.firstName} ${profile.user.lastName}" không có chuyên môn phù hợp. ` +
                            `Yêu cầu: ${requiredSpecialties}. ` +
                            `Chuyên môn hiện có: ${consultantSpecialtiesStr}.`,
                    );
                }
            }
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
     * Kiểm tra và trả về một suất khám trống của một tư vấn viên cụ thể.
     */
    private async findAvailableSlotForConsultant(
        profileId: string,
        dayOfWeek: number,
        time: string,
        date: Date,
        manager: EntityManager,
    ): Promise<ConsultantAvailability> {
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
            throw new NotFoundException(
                'Không tìm thấy lịch làm việc cho tư vấn viên.',
            );
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
        const remainingSlots = availability.maxAppointments - existingCount;
        // Kiểm tra xem còn slot trống không
        if (remainingSlots <= 0) {
            throw new BadRequestException(
                'Tư vấn viên đã hết lịch trống vào thời gian này.',
            );
        }

        return availability;
    }

    /**
     * Tìm kiếm các slot tư vấn khả dụng dựa trên yêu cầu
     */
    async findAvailableSlots(
        findSlotsDto: FindAvailableSlotsDto,
        manager: EntityManager,
    ): Promise<FindAvailableSlotsResponseDto> {
        const {
            serviceIds = [],
            startDate,
            endDate,
            startTime = '08:00',
            endTime = '18:00',
            consultantId,
        } = findSlotsDto;

        // Lấy thông tin services nếu có
        let services: Service[] = [];
        if (serviceIds && serviceIds.length > 0) {
            services = await manager.find(Service, {
                where: { id: In(serviceIds) },
                relations: {
                    category: true,
                },
            });
        }

        // Kiểm tra xem có dịch vụ nào yêu cầu tư vấn viên không
        const consultationServices = services.filter(
            (service) => service.requiresConsultant === true,
        );

        // Nếu không có serviceIds (tư vấn tổng quát) hoặc có dịch vụ yêu cầu tư vấn viên
        const needsConsultant =
            !serviceIds ||
            serviceIds.length === 0 ||
            consultationServices.length > 0;

        if (!needsConsultant) {
            return {
                availableSlots: [],
                totalSlots: 0,
                totalConsultants: 0,
                message: 'Các dịch vụ được chọn không yêu cầu tư vấn viên.',
            };
        }

        // Đối với tư vấn tổng quát, không cần kiểm tra specialty
        const serviceSpecialties =
            !serviceIds || serviceIds.length === 0
                ? []
                : consultationServices.flatMap(
                      (service) => service.specialties || [],
                  );

        // Tính toán khoảng thời gian tìm kiếm
        const searchStartDate = new Date(startDate);
        const searchEndDate = endDate
            ? new Date(endDate)
            : new Date(searchStartDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

        // Tìm tư vấn viên phù hợp
        let profiles: ConsultantProfile[];

        if (consultantId) {
            // Nếu có consultantId cụ thể, tìm consultant đó trước
            const specificProfile = await manager.findOne(ConsultantProfile, {
                where: {
                    user: { id: consultantId },
                    profileStatus: ProfileStatusType.ACTIVE,
                },
                relations: {
                    user: {
                        role: true,
                    },
                },
            });

            if (!specificProfile) {
                return {
                    availableSlots: [],
                    totalSlots: 0,
                    totalConsultants: 0,
                    message: 'Tư vấn viên không tồn tại hoặc không hoạt động.',
                };
            }

            // Kiểm tra specialty matching nếu có yêu cầu (chỉ cho tư vấn có dịch vụ cụ thể)
            if (serviceSpecialties.length > 0) {
                const consultantSpecialties = specificProfile.specialties || [];
                const hasMatchingSpecialty = serviceSpecialties.some(
                    (serviceSpecialty) =>
                        consultantSpecialties.includes(serviceSpecialty),
                );

                if (!hasMatchingSpecialty) {
                    const requiredSpecialties = [
                        ...new Set(serviceSpecialties),
                    ].join(', ');
                    const consultantSpecialtiesStr =
                        consultantSpecialties.length > 0
                            ? consultantSpecialties.join(', ')
                            : 'Không có chuyên môn nào';

                    return {
                        availableSlots: [],
                        totalSlots: 0,
                        totalConsultants: 0,
                        message: `Tư vấn viên "${specificProfile.user.firstName} ${specificProfile.user.lastName}" không có chuyên môn phù hợp. Yêu cầu: ${requiredSpecialties}. Chuyên môn hiện có: ${consultantSpecialtiesStr}.`,
                    };
                }
            }

            profiles = [specificProfile];
        } else {
            // Tìm tất cả tư vấn viên phù hợp
            const whereConditions: FindOptionsWhere<ConsultantProfile> = {
                profileStatus: ProfileStatusType.ACTIVE,
            };

            // Chỉ filter theo specialty nếu có dịch vụ cụ thể yêu cầu
            if (serviceSpecialties.length > 0) {
                whereConditions.specialties = In(serviceSpecialties);
            }

            profiles = await manager.find(ConsultantProfile, {
                where: whereConditions,
                relations: {
                    user: {
                        role: true,
                    },
                },
            });

            if (profiles.length === 0) {
                const message =
                    serviceSpecialties.length > 0
                        ? 'Không tìm thấy tư vấn viên phù hợp với chuyên môn yêu cầu.'
                        : 'Không tìm thấy tư vấn viên nào đang hoạt động.';

                return {
                    availableSlots: [],
                    totalSlots: 0,
                    totalConsultants: 0,
                    message,
                };
            }
        }

        const availableSlots: AvailableSlotDto[] = [];
        const consultantIds = profiles.map((p) => p.id);

        // Tìm tất cả availability slots trong khoảng thời gian
        const currentDate = new Date(searchStartDate);
        while (currentDate <= searchEndDate) {
            const dayOfWeek = currentDate.getDay();

            const dayAvailabilities = await manager.find(
                ConsultantAvailability,
                {
                    where: {
                        consultantProfile: { id: In(consultantIds) },
                        dayOfWeek,
                        startTime: LessThanOrEqual(endTime),
                        endTime: MoreThanOrEqual(startTime),
                        isAvailable: true,
                    },
                    relations: {
                        consultantProfile: {
                            user: {
                                role: true,
                            },
                        },
                    },
                },
            );

            for (const availability of dayAvailabilities) {
                // Tạo các slot 30 phút trong khoảng thời gian availability
                const slots = this.generateTimeSlots(
                    availability,
                    currentDate,
                    startTime,
                    endTime,
                );

                for (const slot of slots) {
                    // Kiểm tra slot này còn trống không
                    const existingCount = await manager.count(Appointment, {
                        where: {
                            consultantAvailability: { id: availability.id },
                            appointmentDate: slot,
                            status: In([
                                AppointmentStatusType.CONFIRMED,
                                AppointmentStatusType.PENDING,
                            ]),
                        },
                    });

                    const remainingSlots =
                        availability.maxAppointments - existingCount;
                    if (remainingSlots > 0) {
                        const profile = availability.consultantProfile;
                        availableSlots.push({
                            dateTime: slot,
                            consultant: {
                                id: profile.user.id,
                                firstName: profile.user.firstName,
                                lastName: profile.user.lastName,
                                specialties: profile.specialties || [],
                                rating: profile.rating,
                                consultationFee: profile.consultationFee,
                            },
                            availabilityId: availability.id,
                            remainingSlots,
                        });
                    }
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Sắp xếp theo thời gian
        availableSlots.sort(
            (a, b) => a.dateTime.getTime() - b.dateTime.getTime(),
        );

        const uniqueConsultants = new Set(
            availableSlots.map((slot) => slot.consultant.id),
        );

        return {
            availableSlots,
            totalSlots: availableSlots.length,
            totalConsultants: uniqueConsultants.size,
        };
    }

    /**
     * Tạo các slot thời gian 30 phút trong khoảng availability
     */
    private generateTimeSlots(
        availability: ConsultantAvailability,
        date: Date,
        filterStartTime: string,
        filterEndTime: string,
    ): Date[] {
        const slots: Date[] = [];

        const startHour = Math.max(
            this.timeStringToMinutes(availability.startTime),
            this.timeStringToMinutes(filterStartTime),
        );
        const endHour = Math.min(
            this.timeStringToMinutes(availability.endTime),
            this.timeStringToMinutes(filterEndTime),
        );

        // Tạo slot mỗi 30 phút
        for (let minutes = startHour; minutes < endHour; minutes += 30) {
            const hour = Math.floor(minutes / 60);
            const minute = minutes % 60;

            const slotDateTime = new Date(date);
            slotDateTime.setHours(hour, minute, 0, 0);

            // Chỉ thêm slot trong tương lai
            if (slotDateTime > new Date()) {
                slots.push(slotDateTime);
            }
        }

        return slots;
    }

    /**
     * Chuyển đổi time string (HH:MM) thành số phút từ 00:00
     */
    private timeStringToMinutes(timeString: string): number {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }
}
