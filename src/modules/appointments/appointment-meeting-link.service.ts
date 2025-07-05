import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { RolesNameEnum } from 'src/enums';
import { Repository } from 'typeorm';
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
        const { status, dateFrom, dateTo } = queryDto;

        const queryBuilder = this.appointmentRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.user', 'user')
            .leftJoinAndSelect('appointment.services', 'services')
            .leftJoinAndSelect('services.category', 'category')
            .leftJoinAndSelect(
                'appointment.consultantAvailability',
                'consultantAvailability',
            )
            .where('appointment.consultant.id = :consultantId', {
                consultantId: consultant.id,
            })
            .andWhere('appointment.deletedAt IS NULL');

        // Filter by status
        if (status) {
            queryBuilder.andWhere('appointment.status = :status', { status });
        }

        // Filter by date range
        if (dateFrom) {
            queryBuilder.andWhere('appointment.appointmentDate >= :dateFrom', {
                dateFrom: new Date(dateFrom),
            });
        }

        if (dateTo) {
            queryBuilder.andWhere('appointment.appointmentDate <= :dateTo', {
                dateTo: new Date(dateTo),
            });
        }

        // Order by appointment date
        queryBuilder.orderBy('appointment.appointmentDate', 'ASC');

        const [appointments, total] = await queryBuilder.getManyAndCount();

        return {
            data: appointments,
            meta: {
                itemsPerPage: total,
                totalItems: total,
                currentPage: 1,
                totalPages: 1,
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
            relations: ['consultant', 'user'],
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
                'Bạn không có quyền cập nhật meeting link cho cuộc hẹn này',
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
            relations: ['consultant', 'user'],
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
            relations: ['consultant', 'user'],
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
