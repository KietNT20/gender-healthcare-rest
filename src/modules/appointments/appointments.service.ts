import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import {
    AppointmentStatusType,
    ConsultantSelectionType,
    ConsultationFeeType,
    LocationTypeEnum,
    RolesNameEnum,
    ServiceCategoryType,
    SortOrder,
} from 'src/enums';
import {
    Between,
    DataSource,
    FindManyOptions,
    In,
    IsNull,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
} from 'typeorm';
import { ChatRoomCleanupService } from '../chat/chat-room-cleanup.service';
import { ChatService } from '../chat/chat.service';
import { Question } from '../chat/entities/question.entity';
import { ConsultantProfile } from '../consultant-profiles/entities/consultant-profile.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { AppointmentBookingService } from './appointment-booking.service';
import { AppointmentNotificationService } from './appointment-notification.service';
import { AppointmentValidationService } from './appointment-validation.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
    FindAvailableSlotsDto,
    FindAvailableSlotsResponseDto,
} from './dto/find-available-slots.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import {
    CancelAppointmentDto,
    UpdateAppointmentDto,
} from './dto/update-appointment.dto';
import { ConsultantAppointmentsMeetingQueryDto } from './dto/update-meeting-link.dto';
import { Appointment } from './entities/appointment.entity';

/**
 * @class AppointmentsService
 * @description Service chính, đóng vai trò điều phối các service con để
 * quản lý các hoạt động liên quan đến cuộc hẹn.
 */
@Injectable()
export class AppointmentsService {
    private readonly logger = new Logger(AppointmentsService.name);
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private readonly dataSource: DataSource,
        private readonly bookingService: AppointmentBookingService,
        private readonly notificationService: AppointmentNotificationService,
        private readonly validationService: AppointmentValidationService,
        private readonly chatService: ChatService,
        private readonly chatRoomCleanupService: ChatRoomCleanupService,
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
        const {
            serviceIds,
            appointmentDate,
            appointmentLocation,
            notes,
            consultantId,
            meetingLink,
        } = createAppointmentDto;

        // Pre-validation trước khi mở transaction
        const appointmentStart = new Date(appointmentDate);
        if (isNaN(appointmentStart.getTime())) {
            throw new BadRequestException(
                'appointmentDate must be a valid ISO 8601 date string',
            );
        }

        // Validate logic nghiệp vụ - phải có ít nhất serviceIds hoặc consultantId
        if (!serviceIds?.length && !consultantId) {
            throw new BadRequestException(
                'Phải cung cấp ít nhất serviceIds hoặc consultantId để tạo cuộc hẹn.',
            );
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // **Optimized: Single query để lấy tất cả data cần thiết**
            const [services, consultant] = await Promise.all([
                // Query services nếu có
                serviceIds?.length
                    ? queryRunner.manager.find(Service, {
                          where: {
                              id: In(serviceIds),
                              isActive: true,
                          },
                          relations: {
                              category: true,
                          },
                      })
                    : Promise.resolve([]),

                // Query consultant với đầy đủ thông tin nếu có
                consultantId
                    ? queryRunner.manager.findOne(User, {
                          where: {
                              id: consultantId,
                              role: {
                                  name: RolesNameEnum.CONSULTANT,
                              },
                              isActive: true,
                          },
                          relations: {
                              consultantProfile: true,
                          },
                      })
                    : Promise.resolve(null),
            ]);

            // Validate services
            if (serviceIds?.length && services.length !== serviceIds.length) {
                throw new NotFoundException(
                    'Một hoặc nhiều dịch vụ không tồn tại.',
                );
            }

            // Validate consultant
            if (
                consultantId &&
                (!consultant ||
                    consultant.consultantProfile?.isVerified === false)
            ) {
                throw new NotFoundException(
                    `Tư vấn viên với ID ${consultantId} không hợp lệ hoặc chưa được xác minh.`,
                );
            }

            const appointmentDurationMinutes =
                consultant?.consultantProfile?.sessionDurationMinutes || 60;
            const appointmentEnd = new Date(
                appointmentStart.getTime() +
                    appointmentDurationMinutes * 60 * 1000,
            );

            // Categorize services
            const {
                servicesRequiringConsultant,
                servicesNotRequiringConsultant,
                needsConsultant,
            } =
                services.length > 0
                    ? this.categorizeServices(services)
                    : {
                          servicesRequiringConsultant: [],
                          servicesNotRequiringConsultant: [],
                          needsConsultant: true,
                      };

            // Validate consultant requirement
            if (needsConsultant && !consultantId) {
                if (services.length > 0) {
                    const consultantServiceNames = servicesRequiringConsultant
                        .map((s) => s.name)
                        .join(', ');
                    throw new BadRequestException(
                        `Các dịch vụ: ${consultantServiceNames} yêu cầu chọn tư vấn viên.`,
                    );
                }
                throw new BadRequestException(
                    'Tư vấn tổng quát yêu cầu phải chọn tư vấn viên.',
                );
            }

            // Validate mixed services
            if (services.length > 0) {
                this.validateMixedServices(
                    servicesRequiringConsultant,
                    servicesNotRequiringConsultant,
                    consultantId,
                );
            }

            // Validate meetingLink
            if (meetingLink && !needsConsultant) {
                throw new BadRequestException(
                    'Chỉ có thể gán meeting link cho các cuộc hẹn có dịch vụ yêu cầu tư vấn viên',
                );
            }

            // **Optimized: Parallel validation cho conflict check và slot validation**
            const validationPromises: Promise<any>[] = [];

            // Check appointment conflict
            validationPromises.push(
                queryRunner.manager
                    .findOne(Appointment, {
                        where: {
                            user: {
                                id: currentUser.id,
                                isActive: true,
                            },
                            consultant: consultantId
                                ? { id: consultantId }
                                : undefined,
                            appointmentDate: Between(
                                appointmentStart,
                                appointmentEnd,
                            ),
                            status: In([
                                AppointmentStatusType.PENDING,
                                AppointmentStatusType.CONFIRMED,
                            ]),
                        },
                    })
                    .then((existing) => {
                        if (existing) {
                            throw new ConflictException(
                                'Bạn đã có lịch tư vấn với tư vấn viên này tại thời điểm này.',
                            );
                        }
                    }),
            );

            // Validate slot for consultation nếu cần
            let bookingDetails: any = null;
            if (needsConsultant && consultant) {
                validationPromises.push(
                    this.bookingService
                        .findAndValidateSlotForConsultation(
                            consultantId!,
                            appointmentDate,
                            services,
                            queryRunner.manager,
                        )
                        .then((details) => {
                            bookingDetails = details;
                        }),
                );
            }

            await Promise.all(validationPromises);

            // **Calculate price một lần duy nhất**
            let totalPrice = 0;
            if (!services.length && consultant?.consultantProfile) {
                // Tư vấn tổng quát
                totalPrice = this.calculateConsultationFee(
                    consultant.consultantProfile,
                    appointmentDurationMinutes,
                    1,
                );
            } else {
                // Có services
                totalPrice = this.calculateAppointmentPrice(
                    servicesRequiringConsultant,
                    servicesNotRequiringConsultant,
                    consultant?.consultantProfile,
                    appointmentDurationMinutes,
                );
            }

            const appointmentData: Partial<Appointment> = {
                user: currentUser,
                services,
                appointmentDate,
                appointmentLocation,
                notes,
                meetingLink: needsConsultant ? meetingLink : undefined,
                fixedPrice: totalPrice,
                status: needsConsultant
                    ? AppointmentStatusType.PENDING
                    : AppointmentStatusType.CONFIRMED,
            };

            // Apply booking details if needed
            if (needsConsultant && bookingDetails) {
                Object.assign(appointmentData, bookingDetails);
            } else if (!needsConsultant && consultant) {
                appointmentData.consultant = consultant;
                appointmentData.consultantSelectionType =
                    ConsultantSelectionType.SERVICE_BOOKING;
            }

            // **Create and save appointment**
            const appointment = queryRunner.manager.create(
                Appointment,
                appointmentData,
            );
            const savedAppointment =
                await queryRunner.manager.save(appointment);

            // **Minimize operations inside transaction - only create chat room if needed**
            if (
                needsConsultant &&
                savedAppointment.consultant &&
                savedAppointment.appointmentLocation === LocationTypeEnum.ONLINE
            ) {
                const existQuestion = await queryRunner.manager.findOne(
                    Question,
                    {
                        where: {
                            appointment: { id: savedAppointment.id },
                        },
                    },
                );

                if (!existQuestion) {
                    await this.chatService.createQuestion(
                        {
                            title: `Tư vấn online với ${savedAppointment.consultant?.firstName || ''} ${savedAppointment.consultant?.lastName || ''}`.trim(),
                            content:
                                'Phòng chat tư vấn online tự động tạo khi đặt lịch.',
                        },
                        currentUser.id,
                        savedAppointment.id,
                        queryRunner.manager,
                    );
                }
            }

            await queryRunner.commitTransaction();

            const notificationPromises: Promise<any>[] = [];
            if (needsConsultant && savedAppointment.consultant) {
                notificationPromises.push(
                    this.notificationService
                        .sendConsultantConfirmationNotification(
                            savedAppointment,
                        )
                        .catch((error) => {
                            this.logger.error(
                                'Failed to send notification:',
                                error,
                            );
                            // Don't throw - notifications shouldn't block appointment creation
                        }),
                );
            }

            // Execute notifications in background
            if (notificationPromises.length > 0) {
                Promise.all(notificationPromises).catch((error) => {
                    this.logger.error('Failed to send notifications:', error);
                });
            }

            // Return appointment data
            return this.findOne(savedAppointment.id, currentUser);
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Error creating appointment:', error);
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
            sortOrder = SortOrder.DESC,
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
                relations: {
                    user: true,
                    services: true,
                    consultant: {
                        consultantProfile: true,
                    },
                },
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
            relations: {
                user: {
                    role: true,
                },
                consultant: {
                    role: true,
                    consultantAvailabilities: true,
                    consultantProfile: true,
                },
                services: true,
                cancelledBy: true,
            },
        });

        if (!appointment) {
            throw new NotFoundException(`Không tìm thấy cuộc hẹn với ID ${id}`);
        }

        // Ủy thác việc xác thực quyền truy cập
        this.validationService.validateUserAccess(appointment, currentUser);

        return appointment;
    }

    async findOneById(id: string): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                user: {
                    role: true,
                },
                consultant: {
                    role: true,
                },
                services: true,
                cancelledBy: true,
            },
        });

        if (!appointment) {
            throw new NotFoundException(`Không tìm thấy cuộc hẹn với ID ${id}`);
        }

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
        const appointment = await this.appointmentRepository.findOne({
            where: { id },
            relations: {
                user: true,
                consultant: true,
                services: {
                    category: true,
                },
            },
        });

        if (!appointment) {
            throw new NotFoundException('Cuộc hẹn không tồn tại');
        }

        // Validate quyền truy cập
        this.validationService.validateUserAccess(appointment, currentUser);

        if (updateDto.status && updateDto.status !== appointment.status) {
            this.validationService.validateStatusTransition(
                appointment,
                appointment.status,
                updateDto.status,
            );
        }

        // Validate meetingLink nếu có trong updateDto
        if (updateDto.meetingLink !== undefined) {
            if (appointment.services && appointment.services.length > 0) {
                const hasConsultationService = appointment.services.some(
                    (service) => service.requiresConsultant === true,
                );

                if (updateDto.meetingLink && !hasConsultationService) {
                    throw new BadRequestException(
                        'Chỉ có thể gán meeting link cho các cuộc hẹn có dịch vụ yêu cầu tư vấn viên',
                    );
                }
            }
        }

        const updatedAppointment = this.appointmentRepository.merge(
            appointment,
            updateDto,
        );
        const savedAppointment =
            await this.appointmentRepository.save(updatedAppointment);

        // Cleanup chat room if appointment status changed to final status
        if (updateDto.status && updateDto.status !== appointment.status) {
            try {
                await this.chatRoomCleanupService.cleanupRoomOnAppointmentStatusChange(
                    savedAppointment.id,
                    updateDto.status,
                );
            } catch (error) {
                this.logger.error(
                    'Error cleaning up chat room on status change:',
                    error,
                );
                // Don't throw error here to avoid breaking the main flow
            }
            // Gửi yêu cầu feedback nếu appointment hoàn thành
            if (updateDto.status === AppointmentStatusType.COMPLETED) {
                await this.notificationService.sendFeedbackRequest(
                    savedAppointment,
                );
            }
        }

        return savedAppointment;
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

        // Cleanup chat room when appointment is cancelled
        try {
            await this.chatRoomCleanupService.cleanupRoomOnAppointmentStatusChange(
                savedAppointment.id,
                AppointmentStatusType.CANCELLED,
            );
        } catch (error) {
            this.logger.error(
                'Error cleaning up chat room on cancellation:',
                error,
            );
            // Don't throw error here to avoid breaking the main flow
        }

        // Ủy thác việc gửi thông báo
        await this.notificationService.sendCancellationNotifications(
            savedAppointment,
        );

        return savedAppointment;
    }

    /**
     * Get chat room by appointment ID
     */
    async getChatRoomByAppointmentId(appointmentId: string): Promise<Question> {
        return this.chatService.getQuestionByAppointmentId(appointmentId);
    }
    async calculateTotalPrice(id: string, currentUser: User): Promise<number> {
        const appointment = await this.findOne(id, currentUser);
        if (!appointment.services || appointment.services.length === 0) {
            return appointment.fixedPrice || 0;
        }

        // Sử dụng calculateDetailedPricing để có thông tin chi tiết
        const { servicesRequiringConsultant, servicesNotRequiringConsultant } =
            this.categorizeServices(appointment.services);

        const { totalPrice } = this.calculateDetailedPricing(
            servicesRequiringConsultant,
            servicesNotRequiringConsultant,
            appointment.consultant?.consultantProfile,
        );

        return totalPrice;
    }

    /**
     * Lấy thông tin chi tiết về giá cả của cuộc hẹn
     */
    async getDetailedPricing(id: string, currentUser: User) {
        const appointment = await this.findOne(id, currentUser);
        if (!appointment.services || appointment.services.length === 0) {
            return {
                consultantServicePrice: 0,
                nonConsultantServicePrice: 0,
                totalPrice: appointment.fixedPrice || 0,
                serviceBreakdown: {
                    consultantServices: [],
                    nonConsultantServices: [],
                },
            };
        }

        const { servicesRequiringConsultant, servicesNotRequiringConsultant } =
            this.categorizeServices(appointment.services);

        return this.calculateDetailedPricing(
            servicesRequiringConsultant,
            servicesNotRequiringConsultant,
            appointment.consultant?.consultantProfile,
        );
    }

    /**
     * Tính toán chi phí chi tiết cho cuộc hẹn hỗn hợp
     */
    private calculateDetailedPricing(
        servicesRequiringConsultant: Service[],
        servicesNotRequiringConsultant: Service[],
        consultantProfile?: ConsultantProfile,
        appointmentDurationMinutes: number = 60,
    ) {
        let consultantServicePrice = 0;

        // Tính phí cho dịch vụ cần tư vấn viên
        if (servicesRequiringConsultant.length > 0) {
            if (consultantProfile?.consultationFee) {
                consultantServicePrice = this.calculateConsultationFee(
                    consultantProfile,
                    appointmentDurationMinutes,
                    servicesRequiringConsultant.length,
                );
            } else {
                // Fallback về service price
                consultantServicePrice = servicesRequiringConsultant.reduce(
                    (sum, service) => sum + Number(service.price),
                    0,
                );
            }
        }

        const nonConsultantServicePrice = servicesNotRequiringConsultant.reduce(
            (sum, service) => sum + Number(service.price),
            0,
        );

        const totalPrice = consultantServicePrice + nonConsultantServicePrice;

        // Tính giá cho từng dịch vụ consultation
        const consultantFeePerService =
            servicesRequiringConsultant.length > 0
                ? consultantServicePrice / servicesRequiringConsultant.length
                : 0;

        return {
            consultantServicePrice,
            nonConsultantServicePrice,
            totalPrice,
            feeDetails: {
                feeType:
                    consultantProfile?.consultationFeeType ||
                    ConsultationFeeType.PER_SESSION,
                baseFee: consultantProfile?.consultationFee || 0,
                calculatedFee: consultantServicePrice,
                appointmentDurationMinutes,
            },
            serviceBreakdown: {
                consultantServices: servicesRequiringConsultant.map((s) => ({
                    id: s.id,
                    name: s.name,
                    price: consultantProfile?.consultationFee
                        ? consultantFeePerService
                        : s.price,
                })),
                nonConsultantServices: servicesNotRequiringConsultant.map(
                    (s) => ({
                        id: s.id,
                        name: s.name,
                        price: s.price,
                    }),
                ),
            },
        };
    }

    /**
     * Phân loại dịch vụ thành những dịch vụ cần và không cần tư vấn viên
     */
    private categorizeServices(services: Service[]) {
        // Validate data integrity - ensure all services have categories
        const servicesWithoutCategory = services.filter((s) => !s.category);
        if (servicesWithoutCategory.length > 0) {
            const serviceNames = servicesWithoutCategory
                .map((s) => s.name)
                .join(', ');
            throw new BadRequestException(
                `Các dịch vụ sau không có danh mục: ${serviceNames}. Vui lòng liên hệ quản trị viên để cập nhật thông tin dịch vụ.`,
            );
        }

        const servicesRequiringConsultant = services.filter(
            (s) =>
                s.requiresConsultant === true ||
                s.category.type === ServiceCategoryType.CONSULTATION.toString(),
        );
        const servicesNotRequiringConsultant = services.filter(
            (s) =>
                s.requiresConsultant !== true &&
                s.category.type !== ServiceCategoryType.CONSULTATION.toString(),
        );
        return {
            servicesRequiringConsultant,
            servicesNotRequiringConsultant,
            needsConsultant: servicesRequiringConsultant.length > 0,
        };
    }

    /**
     * Validate dịch vụ hỗn hợp và consultant requirement
     */
    private validateMixedServices(
        servicesRequiringConsultant: Service[],
        servicesNotRequiringConsultant: Service[],
        consultantId?: string,
    ) {
        const hasMixedServices =
            servicesRequiringConsultant.length > 0 &&
            servicesNotRequiringConsultant.length > 0;

        // Log thông báo khi có dịch vụ hỗn hợp để theo dõi
        if (hasMixedServices) {
            console.log(
                `[Mixed Services] Cuộc hẹn bao gồm ${servicesRequiringConsultant.length} dịch vụ cần tư vấn viên và ${servicesNotRequiringConsultant.length} dịch vụ không cần tư vấn viên. Toàn bộ cuộc hẹn sẽ được thực hiện với tư vấn viên.`,
            );
        }

        // Chỉ throw error khi thiếu consultant cho dịch vụ cần tư vấn viên
        if (servicesRequiringConsultant.length > 0 && !consultantId) {
            const consultantServiceNames = servicesRequiringConsultant
                .map((s) => s.name)
                .join(', ');
            throw new BadRequestException(
                `Các dịch vụ: ${consultantServiceNames} yêu cầu chọn tư vấn viên. Vui lòng chọn tư vấn viên từ danh sách slot khả dụng.`,
            );
        }
    }

    /**
     * Tìm kiếm các slot tư vấn khả dụng
     */
    async findAvailableSlots(
        findSlotsDto: FindAvailableSlotsDto,
    ): Promise<FindAvailableSlotsResponseDto> {
        // Cho phép tìm kiếm slot mà không cần serviceIds (tư vấn tổng quát)
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            return await this.bookingService.findAvailableSlots(
                findSlotsDto,
                queryRunner.manager,
            );
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Lấy danh sách cuộc hẹn của consultant
     */
    async getConsultantAppointments(
        consultant: User,
        queryDto: ConsultantAppointmentsMeetingQueryDto,
    ): Promise<Paginated<Appointment>> {
        const {
            status,
            dateFrom,
            dateTo,
            limit = 10,
            page = 1,
            sortBy = 'appointmentDate',
            sortOrder = SortOrder.ASC,
        } = queryDto;

        const where: FindManyOptions<Appointment>['where'] = {
            consultant: { id: consultant.id },
            deletedAt: IsNull(),
        };

        if (status) {
            where.status = status;
        }

        if (dateFrom && dateTo) {
            where.appointmentDate = Between(
                new Date(dateFrom),
                new Date(dateTo),
            );
        } else if (dateFrom) {
            where.appointmentDate = MoreThanOrEqual(new Date(dateFrom));
        } else if (dateTo) {
            where.appointmentDate = LessThanOrEqual(new Date(dateTo));
        }

        const [appointments, total] =
            await this.appointmentRepository.findAndCount({
                where,
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
     * Tính toán giá cuộc hẹn dựa trên consultant fee và service price
     */
    private calculateAppointmentPrice(
        servicesRequiringConsultant: Service[],
        servicesNotRequiringConsultant: Service[],
        consultantProfile?: ConsultantProfile,
        appointmentDurationMinutes: number = 60, // Mặc định 1 giờ
    ): number {
        // Phí cho các dịch vụ không cần tư vấn viên (sử dụng service price)
        const nonConsultantServicePrice = servicesNotRequiringConsultant.reduce(
            (sum, service) => sum + Number(service.price),
            0,
        );

        // Phí cho các dịch vụ cần tư vấn viên
        let consultantServicePrice = 0;
        if (servicesRequiringConsultant.length > 0) {
            if (consultantProfile?.consultationFee) {
                consultantServicePrice = this.calculateConsultationFee(
                    consultantProfile,
                    appointmentDurationMinutes,
                    servicesRequiringConsultant.length,
                );
            } else {
                // Fallback về service price nếu consultant chưa có consultation fee
                consultantServicePrice = servicesRequiringConsultant.reduce(
                    (sum, service) => sum + Number(service.price),
                    0,
                );
            }
        }

        return nonConsultantServicePrice + consultantServicePrice;
    }

    /**
     * Tính phí tư vấn dựa trên loại phí của consultant
     */
    private calculateConsultationFee(
        consultantProfile: ConsultantProfile,
        appointmentDurationMinutes: number,
        numberOfServices: number,
    ): number {
        const baseFee = Number(consultantProfile.consultationFee);
        const feeType =
            consultantProfile.consultationFeeType ||
            ConsultationFeeType.PER_SESSION;
        const sessionDurationMinutes =
            Number(consultantProfile.sessionDurationMinutes) || 60;

        switch (feeType) {
            case ConsultationFeeType.HOURLY: {
                // Tính theo giờ, có thể tỷ lệ theo thời gian thực tế
                const hours = appointmentDurationMinutes / 60;
                return baseFee * hours;
            }

            case ConsultationFeeType.PER_SERVICE:
                // Tính theo số lượng dịch vụ cần tư vấn viên
                return baseFee * numberOfServices;

            case ConsultationFeeType.PER_SESSION:
                return baseFee;
            default: {
                // Phí cố định cho một session, sử dụng sessionDurationMinutes từ consultant profile
                // Nếu appointment duration khác với session duration, có thể điều chỉnh tỷ lệ
                if (appointmentDurationMinutes !== sessionDurationMinutes) {
                    const sessionRatio =
                        appointmentDurationMinutes / sessionDurationMinutes;
                    return baseFee * sessionRatio;
                }
                return baseFee;
            }
        }
    }
}
