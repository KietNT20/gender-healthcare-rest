import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { RolesNameEnum, SortOrder } from 'src/enums';
import {
    Between,
    FindOptionsWhere,
    IsNull,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AppointmentNotificationService } from './appointment-notification.service';
import {
    ConsultantAppointmentsMeetingQueryDto,
    UpdateMeetingLinkDto,
} from './dto/update-meeting-link.dto';
import { Appointment } from './entities/appointment.entity';

/**
 * @class AppointmentMeetingLinkService
 * @description Service chuyên xử lý các thao tác liên quan đến meeting link của appointments
 */
@Injectable()
export class AppointmentMeetingLinkService {
    private readonly logger = new Logger(AppointmentMeetingLinkService.name);

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private readonly notificationService: AppointmentNotificationService,
    ) {}

    /**
     * Lấy danh sách cuộc hẹn của consultant với khả năng lọc
     */
    async getConsultantAppointments(
        consultant: User,
        queryDto: ConsultantAppointmentsMeetingQueryDto,
    ): Promise<Paginated<Appointment>> {
        const {
            status,
            dateFrom,
            dateTo,
            sortBy = 'status',
            sortOrder = SortOrder.ASC,
            page = 1,
            limit = 10,
        } = queryDto;

        // Build where conditions
        const whereConditions: FindOptionsWhere<Appointment> = {
            consultant: { id: consultant.id },
            deletedAt: IsNull(),
        };

        // Add status filter if provided
        if (status) {
            whereConditions.status = status;
        }

        // Add date range filters
        if (dateFrom && dateTo) {
            whereConditions.appointmentDate = Between(
                new Date(dateFrom),
                new Date(dateTo),
            );
        } else if (dateFrom) {
            whereConditions.appointmentDate = MoreThanOrEqual(
                new Date(dateFrom),
            );
        } else if (dateTo) {
            whereConditions.appointmentDate = LessThanOrEqual(new Date(dateTo));
        }

        // Use findAndCount with options
        const [appointments, total] =
            await this.appointmentRepository.findAndCount({
                where: whereConditions,
                relations: {
                    user: true,
                    services: {
                        category: true,
                    },
                    consultantAvailability: true,
                },
                order: {
                    [sortBy]: sortOrder,
                },
                skip: (page - 1) * limit,
                take: limit,
            });

        return {
            data: appointments,
            meta: {
                itemsPerPage: limit,
                totalItems: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Cập nhật meeting link cho cuộc hẹn
     */
    async updateMeetingLink(
        appointmentId: string,
        updateDto: UpdateMeetingLinkDto,
        currentUser: User,
    ): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId },
            relations: {
                consultant: true,
                user: true,
                services: {
                    category: true,
                },
            },
        });

        if (!appointment) {
            throw new NotFoundException('Cuộc hẹn không tồn tại');
        }

        // Kiểm tra quyền: chỉ consultant được gán hoặc admin/manager có thể cập nhật
        if (
            currentUser.role.name !== RolesNameEnum.ADMIN &&
            currentUser.role.name !== RolesNameEnum.MANAGER &&
            appointment.consultant?.id !== currentUser.id
        ) {
            throw new BadRequestException(
                'Bạn không có quyền cập nhật link cho cuộc hẹn này',
            );
        }

        // Kiểm tra xem cuộc hẹn có chứa dịch vụ yêu cầu tư vấn viên không
        const hasConsultationService = appointment.services.some(
            (service) => service.requiresConsultant === true,
        );

        if (!hasConsultationService) {
            throw new BadRequestException(
                'Chỉ có thể gán meeting link cho các cuộc hẹn có dịch vụ yêu cầu tư vấn viên',
            );
        }

        // Cập nhật meeting link
        appointment.meetingLink = updateDto.meetingLink;

        const savedAppointment =
            await this.appointmentRepository.save(appointment);

        // Gửi thông báo cho customer nếu có meeting link
        if (updateDto.meetingLink) {
            await this.sendMeetingLinkNotification(savedAppointment);
        }

        this.logger.log(
            `Meeting link updated for appointment ${appointmentId} by user ${currentUser.id}`,
        );

        return savedAppointment;
    }

    /**
     * Lấy meeting link của cuộc hẹn
     */
    async getMeetingLink(
        appointmentId: string,
        currentUser: User,
    ): Promise<{ meetingLink?: string }> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId },
            relations: {
                consultant: true,
                user: true,
                services: {
                    category: true,
                },
            },
        });

        if (!appointment) {
            throw new NotFoundException('Cuộc hẹn không tồn tại');
        }

        // Kiểm tra quyền: chỉ những người liên quan mới có thể xem meeting link
        if (
            currentUser.role.name !== RolesNameEnum.ADMIN &&
            currentUser.role.name !== RolesNameEnum.MANAGER &&
            appointment.consultant?.id !== currentUser.id &&
            appointment.user.id !== currentUser.id
        ) {
            throw new BadRequestException(
                'Bạn không có quyền xem meeting link của cuộc hẹn này',
            );
        }

        // Kiểm tra xem cuộc hẹn có chứa dịch vụ yêu cầu tư vấn viên không
        const hasConsultationService = appointment.services.some(
            (service) => service.requiresConsultant === true,
        );

        if (!hasConsultationService) {
            throw new BadRequestException(
                'Chỉ có thể xem meeting link cho các cuộc hẹn có dịch vụ yêu cầu tư vấn viên',
            );
        }

        return {
            meetingLink: appointment.meetingLink,
        };
    }

    /**
     * Xóa meeting link của cuộc hẹn
     */
    async removeMeetingLink(
        appointmentId: string,
        currentUser: User,
    ): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId },
            relations: {
                consultant: true,
                user: true,
                services: {
                    category: true,
                },
            },
        });

        if (!appointment) {
            throw new NotFoundException('Cuộc hẹn không tồn tại');
        }

        // Kiểm tra quyền: chỉ consultant được gán hoặc admin/manager có thể xóa
        if (
            currentUser.role.name !== RolesNameEnum.ADMIN &&
            currentUser.role.name !== RolesNameEnum.MANAGER &&
            appointment.consultant?.id !== currentUser.id
        ) {
            throw new BadRequestException(
                'Bạn không có quyền xóa meeting link của cuộc hẹn này',
            );
        }

        // Kiểm tra xem cuộc hẹn có chứa dịch vụ yêu cầu tư vấn viên không
        const hasConsultationService = appointment.services.some(
            (service) => service.requiresConsultant === true,
        );

        if (!hasConsultationService) {
            throw new BadRequestException(
                'Chỉ có thể xóa meeting link cho các cuộc hẹn có dịch vụ yêu cầu tư vấn viên',
            );
        }

        // Xóa meeting link
        appointment.meetingLink = undefined;

        const savedAppointment =
            await this.appointmentRepository.save(appointment);

        this.logger.log(
            `Meeting link removed for appointment ${appointmentId} by user ${currentUser.id}`,
        );

        return savedAppointment;
    }

    /**
     * Gửi thông báo meeting link cho customer
     */
    private async sendMeetingLinkNotification(
        appointment: Appointment,
    ): Promise<void> {
        try {
            await this.notificationService.sendMeetingLinkNotification(
                appointment,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send meeting link notification for appointment ${appointment.id}`,
                error,
            );
        }
    }
}
