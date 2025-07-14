import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppointmentStatusType, RolesNameEnum, SortOrder } from 'src/enums';
import { Between, DataSource, Like, Raw, Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { AppointmentNotificationService } from './appointment-notification.service';
import { CreateStiAppointmentDto } from './dto/create-sti-appointment.dto';
import { Appointment } from './entities/appointment.entity';

/**
 * @class StiAppointmentsService
 * @description Service chuyên biệt cho việc đặt lịch xét nghiệm STI
 */
@Injectable()
export class StiAppointmentsService {
    private readonly logger = new Logger(StiAppointmentsService.name);

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        private readonly dataSource: DataSource,
        private readonly notificationService: AppointmentNotificationService,
    ) {}

    /**
     * Tạo lịch hẹn xét nghiệm STI
     * @param createStiAppointmentDto - Dữ liệu tạo lịch hẹn STI
     * @param currentUser - Người dùng hiện tại
     * @returns Lịch hẹn đã tạo
     */
    async createStiAppointment(
        createStiAppointmentDto: CreateStiAppointmentDto,
        currentUser: User,
    ): Promise<Appointment> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const {
                stiServiceId,
                consultantId,
                sampleCollectionDate,
                sampleCollectionLocation,
                notes,
            } = createStiAppointmentDto;

            // Validate STI service
            const stiService = await this.validateStiService(stiServiceId);

            // Validate consultant if provided
            let consultant: User | null = null;
            if (consultantId) {
                consultant = await this.validateConsultant(consultantId);
            }

            // Validate sample collection date
            await this.validateSampleCollectionDate(sampleCollectionDate);

            // Check for conflicts
            await this.checkForConflicts(currentUser.id, sampleCollectionDate);

            // Create appointment
            const appointment = this.appointmentRepository.create({
                user: currentUser,
                consultant: consultant || undefined,
                appointmentDate: sampleCollectionDate,
                appointmentLocation: sampleCollectionLocation,
                status: AppointmentStatusType.CONFIRMED,
                notes,
                services: [stiService],
                fixedPrice: stiService.price,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const savedAppointment =
                await queryRunner.manager.save(appointment);

            // Load complete appointment with relations
            const completeAppointment = await queryRunner.manager.findOne(
                Appointment,
                {
                    where: { id: savedAppointment.id },
                    relations: {
                        user: true,
                        consultant: true,
                        services: true,
                    },
                },
            );

            if (!completeAppointment) {
                throw new Error('Failed to retrieve saved appointment');
            }

            // Send notification
            await this.sendStiAppointmentNotification(completeAppointment);

            await queryRunner.commitTransaction();

            this.logger.log(
                `STI appointment created successfully for user ${currentUser.id}`,
            );

            return completeAppointment;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(
                `Failed to create STI appointment: ${error.message}`,
            );
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Send notification for STI appointment
     * @param appointment - Appointment entity
     */
    private async sendStiAppointmentNotification(
        appointment: Appointment,
    ): Promise<void> {
        try {
            this.logger.log(
                `Sending STI appointment notification for appointment ${appointment.id}`,
            );

            // Gửi thông báo tạo lịch hẹn
            this.notificationService.sendCreationNotifications(appointment);

            // Gửi thông báo cho tư vấn viên nếu có
            if (appointment.consultant) {
                this.notificationService.sendConsultantConfirmationNotification(
                    appointment,
                );
            }

            this.logger.log(
                `STI appointment notification sent successfully for appointment ${appointment.id}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send STI appointment notification: ${error.message}`,
            );
            // Không throw error để không làm gián đoạn việc tạo appointment
        }
    }

    /**
     * Validate STI service
     * @param stiServiceId - ID của dịch vụ STI
     * @returns Service entity
     */
    private async validateStiService(stiServiceId: string): Promise<Service> {
        const service = await this.serviceRepository.findOne({
            where: { id: stiServiceId },
            relations: {
                category: true,
            },
        });

        if (!service) {
            throw new NotFoundException(
                `Dịch vụ xét nghiệm STI với ID ${stiServiceId} không tồn tại`,
            );
        }

        // Check if service is related to STI testing (assuming name or description contains STI)
        if (
            !service.name.toLowerCase().includes('sti') &&
            !service.description.toLowerCase().includes('sti') &&
            !service.category.type.toLowerCase().includes('sti_test')
        ) {
            throw new BadRequestException(
                'Dịch vụ được chọn không phải là dịch vụ xét nghiệm STI',
            );
        }

        if (!service.isActive) {
            throw new BadRequestException(
                'Dịch vụ xét nghiệm STI hiện tại không khả dụng',
            );
        }

        return service;
    }

    /**
     * Validate consultant
     * @param consultantId - ID của tư vấn viên
     * @returns User entity
     */
    private async validateConsultant(consultantId: string): Promise<User> {
        const consultant = await this.userRepository.findOne({
            where: { id: consultantId },
            relations: {
                role: true,
            },
        });

        if (!consultant) {
            throw new NotFoundException(
                `Tư vấn viên với ID ${consultantId} không tồn tại`,
            );
        }

        if (consultant.role.name !== RolesNameEnum.CONSULTANT) {
            throw new BadRequestException(
                'Người dùng được chọn không phải là tư vấn viên',
            );
        }

        if (!consultant.isActive) {
            throw new BadRequestException(
                'Tư vấn viên hiện tại không khả dụng',
            );
        }

        return consultant;
    }

    /**
     * Validate sample collection date
     * @param sampleCollectionDate - Ngày lấy mẫu
     */
    private async validateSampleCollectionDate(
        sampleCollectionDate: Date,
    ): Promise<void> {
        const now = new Date();
        if (sampleCollectionDate <= now) {
            throw new BadRequestException(
                'Thời gian lấy mẫu phải là một thời điểm trong tương lai',
            );
        }

        // Check if it's within working hours (e.g., 8 AM to 5 PM)
        const hours = sampleCollectionDate.getHours();
        if (hours < 8 || hours > 17) {
            throw new BadRequestException(
                'Thời gian lấy mẫu phải trong giờ làm việc (8:00 - 17:00)',
            );
        }

        // Check if it's not on weekend
        const dayOfWeek = sampleCollectionDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            throw new BadRequestException(
                'Không thể đặt lịch lấy mẫu vào cuối tuần',
            );
        }
    }

    /**
     * Check for scheduling conflicts
     * @param userId - ID của người dùng
     * @param sampleCollectionDate - Ngày lấy mẫu
     */
    private async checkForConflicts(
        userId: string,
        sampleCollectionDate: Date,
    ): Promise<void> {
        const startTime = new Date(sampleCollectionDate);
        startTime.setMinutes(startTime.getMinutes() - 30); // 30 minutes before

        const endTime = new Date(sampleCollectionDate);
        endTime.setMinutes(endTime.getMinutes() + 30); // 30 minutes after

        const conflictingAppointments = await this.appointmentRepository.find({
            where: {
                user: { id: userId },
                appointmentDate: Between(startTime, endTime),
                status: AppointmentStatusType.CONFIRMED,
            },
        });

        if (conflictingAppointments.length > 0) {
            throw new ConflictException(
                'Bạn đã có lịch hẹn khác trong khoảng thời gian này',
            );
        }
    }

    /**
     * Lấy danh sách lịch hẹn STI của người dùng
     * @param userId - ID người dùng
     * @returns Danh sách lịch hẹn STI
     */
    async getUserStiAppointments(userId: string): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
        where: {
            user: { id: userId },
            services: {
                // Sử dụng Raw để kiểm tra điều kiện tương tự isStiAppointment
                name: Raw(alias => `LOWER(${alias}) LIKE '%sti%'`),
                // hoặc description chứa 'sti'
                description: Raw(alias => `LOWER(${alias}) LIKE '%sti%'`),
                // hoặc category.type chứa 'sti_test'
                category: {
                    type: Raw(alias => `LOWER(${alias}) LIKE '%sti_test%'`),
                },
            },
        },
        relations: {
            services: {
                category: true, // Đảm bảo lấy thông tin category để kiểm tra type
            },
            consultant: true,
        },
        order: {
            appointmentDate: SortOrder.DESC,
        },
    });
}

    /**
     * Hủy lịch hẹn STI
     * @param appointmentId - ID lịch hẹn
     * @param userId - ID người dùng
     * @param reason - Lý do hủy
     */
    async cancelStiAppointment(
        appointmentId: string,
        userId: string,
        reason?: string,
    ): Promise<void> {
        const appointment = await this.appointmentRepository.findOne({
            where: {
                id: appointmentId,
                user: { id: userId },
            },
            relations: {
                services: true,
            },
        });

        if (!appointment) {
            throw new NotFoundException('Lịch hẹn không tồn tại');
        }

        // Check if it's an STI appointment
        const isStiAppointment = appointment.services.some(
            (service) =>
                service.name.toLowerCase().includes('sti') ||
                service.description.toLowerCase().includes('sti') ||
                service.category.type.toLowerCase().includes('sti_test'),
        );

        if (!isStiAppointment) {
            throw new BadRequestException(
                'Lịch hẹn này không phải là lịch hẹn xét nghiệm STI',
            );
        }

        if (appointment.status !== AppointmentStatusType.CONFIRMED) {
            throw new BadRequestException(
                'Chỉ có thể hủy lịch hẹn đã được xác nhận',
            );
        }

        // Check if cancellation is allowed (e.g., at least 24 hours before)
        const hoursUntilAppointment =
            (appointment.appointmentDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60);

        if (hoursUntilAppointment < 24) {
            throw new BadRequestException(
                'Chỉ có thể hủy lịch hẹn ít nhất 24 giờ trước thời gian đặt',
            );
        }

        appointment.status = AppointmentStatusType.CANCELLED;
        appointment.cancellationReason = reason;
        appointment.updatedAt = new Date();

        await this.appointmentRepository.save(appointment);

        // Send cancellation notification
        await this.sendStiAppointmentCancellationNotification(
            appointment,
            reason,
        );

        this.logger.log(
            `STI appointment ${appointmentId} cancelled by user ${userId}`,
        );
    }

    /**
     * Send cancellation notification
     * @param appointment - Appointment entity
     * @param reason - Cancellation reason
     */
    private async sendStiAppointmentCancellationNotification(
        appointment: Appointment,
        reason?: string,
    ): Promise<void> {
        try {
            this.logger.log(
                `Sending STI appointment cancellation notification for appointment ${appointment.id}`,
            );

            appointment.cancellationReason = reason;
            // Gửi thông báo hủy lịch hẹn
            this.notificationService.sendCancellationNotifications(appointment);

            this.logger.log(
                `STI appointment cancellation notification sent successfully for appointment ${appointment.id}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send STI appointment cancellation notification: ${error.message}`,
            );
            // Không throw error để không làm gián đoạn việc hủy appointment
        }
    }

    /**
     * Lấy thông tin chi tiết lịch hẹn STI
     * @param appointmentId - ID lịch hẹn
     * @param userId - ID người dùng
     * @returns Thông tin chi tiết lịch hẹn STI
     */
    async getStiAppointmentById(
        appointmentId: string,
        userId: string,
    ): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findOne({
            where: {
                id: appointmentId,
                user: { id: userId },
            },
            relations: {
                services: true,
                consultant: true,
                user: true,
            },
        });

        if (!appointment) {
            throw new NotFoundException('Lịch hẹn không tồn tại');
        }

        // Check if it's an STI appointment
        const isStiAppointment = appointment.services.some(
            (service) =>
                service.name.toLowerCase().includes('sti') ||
                service.description.toLowerCase().includes('sti') ||
                service.category.type.toLowerCase().includes('sti_test'),
        );

        if (!isStiAppointment) {
            throw new BadRequestException(
                'Lịch hẹn này không phải là lịch hẹn xét nghiệm STI',
            );
        }

        return appointment;
    }
}