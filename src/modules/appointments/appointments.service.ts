import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import {
    AppointmentStatusType,
    ConsultantSelectionType,
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
    Repository,
} from 'typeorm';
import { ChatService } from '../chat/chat.service';
import { Question } from '../chat/entities/question.entity';
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
                meetingLink,
            } = createAppointmentDto;

            const appointmentStart = new Date(appointmentDate);
            if (isNaN(appointmentStart.getTime())) {
                console.error('Invalid appointmentDate:', appointmentDate);
                throw new BadRequestException(
                    'appointmentDate must be a valid ISO 8601 date string',
                );
            }
            const appointmentEnd = new Date(
                appointmentStart.getTime() + 60 * 60 * 1000,
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
                throw new ConflictException(
                    'Bạn đã có lịch tư vấn với tư vấn viên này tại thời điểm này.',
                );
            }

            const services = await queryRunner.manager.find(Service, {
                where: { id: In(serviceIds) },
                relations: {
                    category: true,
                },
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
            // Phân loại dịch vụ sử dụng helper method
            // Logic: Nếu có ít nhất 1 dịch vụ cần tư vấn viên thì toàn bộ cuộc hẹn sẽ cần tư vấn viên
            // Điều này đảm bảo tính nhất quán trong quy trình và đơn giản hóa logic booking
            const {
                servicesRequiringConsultant,
                servicesNotRequiringConsultant,
                needsConsultant,
            } = this.categorizeServices(services);

            // Validate dịch vụ hỗn hợp và consultant requirement
            this.validateMixedServices(
                servicesRequiringConsultant,
                servicesNotRequiringConsultant,
                consultantId,
            );

            // Validate meetingLink: chỉ cho phép khi có dịch vụ yêu cầu tư vấn viên
            if (meetingLink && !needsConsultant) {
                throw new BadRequestException(
                    'Chỉ có thể gán meeting link cho các cuộc hẹn có dịch vụ yêu cầu tư vấn viên',
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
            if (needsConsultant) {
                const bookingDetails =
                    await this.bookingService.findAndValidateSlotForConsultation(
                        consultantId!,
                        appointmentDate,
                        services,
                        queryRunner.manager,
                    );
                Object.assign(appointmentData, bookingDetails);
            } else {
                // Dịch vụ không yêu cầu tư vấn viên (xét nghiệm, kiểm tra sức khỏe, etc.)
                appointmentData.consultantSelectionType =
                    ConsultantSelectionType.SERVICE_BOOKING;
                // Nếu có consultantId được cung cấp, có thể gán nhưng không bắt buộc
                if (consultantId) {
                    // Validate consultant tồn tại và active
                    const consultant = await queryRunner.manager.findOne(User, {
                        where: {
                            id: consultantId,
                            role: { name: RolesNameEnum.CONSULTANT },
                            isActive: true,
                        },
                        relations: {
                            consultantProfile: {
                                user: {
                                    role: true,
                                },
                            },
                        },
                    });

                    if (consultant && consultant.consultantProfile) {
                        appointmentData.consultant = consultant;
                    }
                }
            }

            const appointment = queryRunner.manager.create(
                Appointment,
                appointmentData,
            );
            const savedAppointment =
                await queryRunner.manager.save(appointment);
            // 2. Nếu cần tư vấn viên, tự động tạo phòng chat (Question) gắn với appointment
            if (needsConsultant && savedAppointment.consultant) {
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

            if (needsConsultant && savedAppointment.consultant) {
                this.notificationService.sendConsultantConfirmationNotification(
                    savedAppointment,
                );
            }

            return this.findOne(savedAppointment.id, currentUser);
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            this.logger.error(error);
            throw new InternalServerErrorException(
                'Không thể tạo cuộc hẹn: ' +
                    (error instanceof Error ? error.message : 'Chưa xác định'),
            );
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

        // Validate meetingLink nếu có trong updateDto
        if (updateDto.meetingLink !== undefined) {
            const hasConsultationService = appointment.services.some(
                (service) => service.requiresConsultant === true,
            );

            if (updateDto.meetingLink && !hasConsultationService) {
                throw new BadRequestException(
                    'Chỉ có thể gán meeting link cho các cuộc hẹn có dịch vụ yêu cầu tư vấn viên',
                );
            }
        }

        const updatedAppointment = this.appointmentRepository.merge(
            appointment,
            updateDto,
        );
        return this.appointmentRepository.save(updatedAppointment);
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
        );
    }

    /**
     * Tính toán chi phí chi tiết cho cuộc hẹn hỗn hợp
     */
    private calculateDetailedPricing(
        servicesRequiringConsultant: Service[],
        servicesNotRequiringConsultant: Service[],
    ) {
        const consultantServicePrice = servicesRequiringConsultant.reduce(
            (sum, service) => sum + Number(service.price),
            0,
        );

        const nonConsultantServicePrice = servicesNotRequiringConsultant.reduce(
            (sum, service) => sum + Number(service.price),
            0,
        );

        const totalPrice = consultantServicePrice + nonConsultantServicePrice;

        return {
            consultantServicePrice,
            nonConsultantServicePrice,
            totalPrice,
            serviceBreakdown: {
                consultantServices: servicesRequiringConsultant.map((s) => ({
                    id: s.id,
                    name: s.name,
                    price: s.price,
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
        const servicesRequiringConsultant = services.filter(
            (s) =>
                s.requiresConsultant === true ||
                s.category.type === ServiceCategoryType.CONSULTATION,
        );
        const servicesNotRequiringConsultant = services.filter(
            (s) =>
                s.requiresConsultant !== true &&
                s.category.type !== ServiceCategoryType.CONSULTATION,
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
        if (!findSlotsDto.serviceIds || findSlotsDto.serviceIds.length === 0) {
            throw new BadRequestException(
                'Vui lòng chọn ít nhất một dịch vụ tư vấn để tìm kiếm',
            );
        }

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
}
