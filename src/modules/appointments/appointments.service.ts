import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import {
    AppointmentStatusType,
    ConsultantSelectionType,
    RolesNameEnum,
    ServiceCategoryType,
} from 'src/enums';
import {
    Between,
    DataSource,
    FindManyOptions,
    In,
    IsNull,
    Repository,
} from 'typeorm';
import { ChatService } from '../chat/chat.service';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { AppointmentBookingService } from './appointment-booking.service';
import { AppointmentNotificationService } from './appointment-notification.service';
import { AppointmentValidationService } from './appointment-validation.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import {
    CancelAppointmentDto,
    UpdateAppointmentDto,
} from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';

/**
 * @class AppointmentsService
 * @description Service chính, đóng vai trò điều phối các service con để
 * quản lý các hoạt động liên quan đến cuộc hẹn.
 */
@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private readonly dataSource: DataSource,
        private readonly bookingService: AppointmentBookingService,
        private readonly notificationService: AppointmentNotificationService,
        private readonly validationService: AppointmentValidationService,
        private readonly chatService: ChatService,
    ) {}

    /**
     * Tạo một cuộc hẹn mới, sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu.
     * @param createDto - Dữ liệu để tạo cuộc hẹn.
     * @param currentUser - Người dùng hiện tại đang thực hiện yêu cầu.
     * @returns Cuộc hẹn đã được tạo.
     */
    async create(
        createAppointmentDto: CreateAppointmentDto,
        currentUser: User,
    ): Promise<Appointment> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const {
                serviceIds,
                appointmentDate,
                appointmentLocation,
                notes,
                consultantId,
            } = createAppointmentDto;

            // 1. Kiểm tra trùng lịch: cùng user, cùng consultant, cùng thời điểm hoặc trùng khoảng thời gian
            const appointmentStart = new Date(appointmentDate);
            const appointmentEnd = new Date(
                appointmentDate.getTime() + 60 * 60 * 1000,
            ); // Giả sử mỗi lịch hẹn kéo dài 1 giờ

            const existing = await queryRunner.manager.findOne(Appointment, {
                where: {
                    user: { id: currentUser.id },
                    consultant: consultantId ? { id: consultantId } : undefined,
                    appointmentDate: Between(appointmentStart, appointmentEnd),
                    status: In([
                        AppointmentStatusType.PENDING,
                        AppointmentStatusType.CONFIRMED,
                    ]),
                },
            });
            if (existing) {
                throw new Error(
                    'Bạn đã có lịch tư vấn với tư vấn viên này tại thời điểm này.',
                );
            }

            const services = await queryRunner.manager.find(Service, {
                where: { id: In(serviceIds) },
                relations: ['category'],
            });

            if (services.length !== serviceIds.length) {
                throw new NotFoundException(
                    'Một hoặc nhiều dịch vụ không tồn tại.',
                );
            }

            const totalPrice = services.reduce(
                (sum, service) => sum + Number(service.price),
                0,
            );
            const isConsultation = services.some(
                (s) => s.category.type === ServiceCategoryType.CONSULTATION,
            );

            const appointmentData: Partial<Appointment> = {
                user: currentUser,
                services,
                appointmentDate,
                appointmentLocation,
                notes,
                fixedPrice: totalPrice,
                status: isConsultation
                    ? AppointmentStatusType.PENDING
                    : AppointmentStatusType.CONFIRMED,
            };

            if (isConsultation) {
                const bookingDetails =
                    await this.bookingService.findAndValidateSlotForConsultation(
                        consultantId,
                        appointmentDate,
                        services,
                        queryRunner.manager,
                    );
                Object.assign(appointmentData, bookingDetails);
            } else {
                appointmentData.consultantSelectionType =
                    ConsultantSelectionType.SERVICE_BOOKING;
            }

            const appointment = queryRunner.manager.create(
                Appointment,
                appointmentData,
            );
            const savedAppointment =
                await queryRunner.manager.save(appointment);

            // 2. Nếu là consultation, tự động tạo phòng chat (Question) gắn với appointment
            if (isConsultation) {
                // Kiểm tra đã có Question chưa
                const existQuestion = await queryRunner.manager.findOne(
                    'Question',
                    {
                        where: { appointment: { id: savedAppointment.id } },
                    },
                );
                if (!existQuestion) {
                    // Tạo phòng chat
                    await this.chatService.createQuestion(
                        {
                            title: `Tư vấn với ${savedAppointment.consultant?.firstName || ''} ${savedAppointment.consultant?.lastName || ''}`.trim(),
                            content:
                                'Phòng chat tư vấn tự động tạo khi đặt lịch.',
                        },
                        currentUser.id,
                        savedAppointment.id,
                        queryRunner.manager,
                    );
                }
            }

            await queryRunner.commitTransaction();

            if (isConsultation) {
                this.notificationService.sendConsultantConfirmationNotification(
                    savedAppointment,
                );
            }

            return this.findOne(savedAppointment.id, currentUser);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Lấy danh sách các cuộc hẹn với phân trang và bộ lọc dựa trên quyền của người dùng.
     * @param currentUser - Người dùng hiện tại.
     * @param queryDto - DTO chứa các tham số truy vấn.
     * @returns Danh sách các cuộc hẹn đã được phân trang.
     */
    async findAll(
        currentUser: User,
        queryDto: QueryAppointmentDto,
    ): Promise<Paginated<Appointment>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'appointmentDate',
            sortOrder = 'ASC',
            ...filters
        } = queryDto;

        const where: FindManyOptions<Appointment>['where'] = {
            deletedAt: IsNull(),
        };

        // Áp dụng bộ lọc dựa trên vai trò
        if (currentUser.role.name === RolesNameEnum.CUSTOMER) {
            where.user = { id: currentUser.id };
        } else if (currentUser.role.name === RolesNameEnum.CONSULTANT) {
            where.consultant = { id: currentUser.id };
        } else if (filters.userId) {
            where.user = { id: filters.userId };
        }

        if (filters.consultantId)
            where.consultant = { id: filters.consultantId };
        if (filters.status) where.status = filters.status;
        if (filters.fromDate && filters.toDate) {
            where.appointmentDate = Between(
                new Date(filters.fromDate),
                new Date(filters.toDate),
            );
        }

        const [data, totalItems] =
            await this.appointmentRepository.findAndCount({
                where,
                relations: [
                    'user',
                    'consultant',
                    'services',
                    'consultant.consultantProfile',
                ],
                order: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            });

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

    /**
     * Lấy chi tiết một cuộc hẹn và xác thực quyền truy cập.
     * @param id - ID của cuộc hẹn.
     * @param currentUser - Người dùng hiện tại.
     * @returns Thông tin chi tiết của cuộc hẹn.
     */
    async findOne(id: string, currentUser: User): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: [
                'user',
                'user.role',
                'consultant',
                'consultant.role',
                'services',
                'cancelledBy',
            ],
        });

        if (!appointment) {
            throw new NotFoundException(`Không tìm thấy cuộc hẹn với ID ${id}`);
        }

        // Ủy thác việc xác thực quyền truy cập
        this.validationService.validateUserAccess(appointment, currentUser);

        return appointment;
    }

    /**
     * Cập nhật trạng thái của một cuộc hẹn.
     * @param id - ID của cuộc hẹn.
     * @param updateDto - Dữ liệu cập nhật.
     * @param currentUser - Người dùng hiện tại.
     * @returns Cuộc hẹn đã được cập nhật.
     */
    async updateStatus(
        id: string,
        updateDto: UpdateAppointmentDto,
        currentUser: User,
    ): Promise<Appointment> {
        const appointment = await this.findOne(id, currentUser);
        Object.assign(appointment, updateDto);
        return this.appointmentRepository.save(appointment);
    }

    /**
     * Hủy một cuộc hẹn.
     * @param id - ID của cuộc hẹn.
     * @param cancelDto - Lý do hủy.
     * @param currentUser - Người dùng hiện tại.
     * @returns Cuộc hẹn đã bị hủy.
     */
    async cancel(
        id: string,
        cancelDto: CancelAppointmentDto,
        currentUser: User,
    ): Promise<Appointment> {
        const appointment = await this.findOne(id, currentUser);

        // Ủy thác việc xác thực
        this.validationService.validateCancellation(appointment);

        appointment.status = AppointmentStatusType.CANCELLED;
        appointment.cancellationReason = cancelDto.cancellationReason;
        appointment.cancelledBy = currentUser;

        const savedAppointment =
            await this.appointmentRepository.save(appointment);

        // Ủy thác việc gửi thông báo
        this.notificationService.sendCancellationNotifications(
            savedAppointment,
        );

        return savedAppointment;
    }

    /**
     * Get chat room by appointment ID
     */
    async getChatRoomByAppointmentId(appointmentId: string): Promise<any> {
        return this.chatService.getQuestionByAppointmentId(appointmentId);
    }
}
