import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    CheckoutRequestType,
    CheckoutResponseDataType,
    PaymentLinkDataType,
    WebhookDataType,
    WebhookType,
} from '@payos/node/lib/type';
import { PaymentStatusType, SortOrder } from 'src/enums';
import { IsNull, Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';
import { AppointmentsService } from '../appointments/appointments.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { CreateAppointmentPaymentDto } from './dto/create-appointment-payment.dto';
import { CreatePackagePaymentDto } from './dto/create-package-payment.dto';
import { CreateServicePaymentDto } from './dto/create-service-payment.dto';
import { Payment } from './entities/payment.entity';
import { PayOSPaymentStatus } from './enums/payos.enum';
import { PaymentSubscriptionService } from './payment-subscription.service';
import PayOS = require('@payos/node');

@Injectable()
export class PaymentsService {
    private payOS: PayOS;
    private readonly defaultFrontendDomain: string;
    private readonly backendReturnUrl: string;
    private readonly backendCancelUrl: string;

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(ServicePackage)
        private readonly packageRepository: Repository<ServicePackage>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        private readonly paymentSubscriptionService: PaymentSubscriptionService,
        private readonly appointmentsService: AppointmentsService,
    ) {
        const clientId = process.env.PAYOS_CLIENT_ID;
        const apiKey = process.env.PAYOS_API_KEY;
        const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

        if (!clientId || !apiKey || !checksumKey) {
            throw new InternalServerErrorException('Missing PayOS credentials');
        }

        this.payOS = new PayOS(clientId, apiKey, checksumKey);
        // URLs cho backend callback processing
        this.backendReturnUrl = process.env.BACKEND_RETURN_URL as string;
        this.backendCancelUrl = process.env.BACKEND_CANCEL_URL as string;

        if (!this.backendReturnUrl || !this.backendCancelUrl) {
            throw new InternalServerErrorException(
                'Missing Back-end return or cancel URLs',
            );
        }
        // Default frontend domain for redirects
        this.defaultFrontendDomain = process.env.FRONTEND_BASE_URL as string;

        if (!this.defaultFrontendDomain) {
            throw new InternalServerErrorException('Missing Front-end URL');
        }
    }

    /**
     * Tạo thanh toán cho gói dịch vụ
     */
    async createPackagePayment(
        createDto: CreatePackagePaymentDto,
        userId: string,
    ) {
        const { packageId, description, frontendReturnUrl, frontendCancelUrl } =
            createDto;

        const user = await this.validateUser(userId);
        const servicePackage = await this.packageRepository.findOne({
            where: { id: packageId, deletedAt: IsNull() },
            select: ['id', 'price', 'name'],
        });

        if (!servicePackage) {
            throw new NotFoundException(
                `Service package with ID '${packageId}' not found`,
            );
        }

        const finalAmount = this.validateAmount(servicePackage.price);
        const itemName = (servicePackage.name || 'Gói dịch vụ').slice(0, 25);
        const shortDescription = (
            description || `Thanh toán: ${itemName}`
        ).slice(0, 25);

        return this.createPaymentLink({
            amount: finalAmount,
            itemName,
            description: shortDescription,
            userId,
            packageId,
            frontendReturnUrl:
                frontendReturnUrl ||
                `${this.defaultFrontendDomain}/packages/payment/success`,
            frontendCancelUrl:
                frontendCancelUrl ||
                `${this.defaultFrontendDomain}/packages/payment/cancel`,
        });
    }

    /**
     * Tạo thanh toán cho cuộc hẹn
     */
    async createAppointmentPayment(
        createDto: CreateAppointmentPaymentDto,
        userId: string,
    ) {
        const {
            appointmentId,
            description,
            frontendReturnUrl,
            frontendCancelUrl,
        } = createDto;

        const user = await this.validateUser(userId);
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId, deletedAt: IsNull() },
        });

        if (!appointment) {
            throw new NotFoundException(
                `Appointment with ID '${appointmentId}' not found`,
            );
        }

        const finalAmount = this.validateAmount(
            appointment.fixedPrice ||
                (await this.appointmentsService.calculateTotalPrice(
                    appointmentId,
                    user,
                )),
        );
        const itemName = (appointment.notes || 'Cuộc hẹn').slice(0, 25);
        const shortDescription = (
            description || `Thanh toán: ${itemName}`
        ).slice(0, 25);

        return this.createPaymentLink({
            amount: finalAmount,
            itemName,
            description: shortDescription,
            userId,
            appointmentId,
            frontendReturnUrl:
                frontendReturnUrl ||
                `${this.defaultFrontendDomain}/appointments/payment/success`,
            frontendCancelUrl:
                frontendCancelUrl ||
                `${this.defaultFrontendDomain}/appointments/payment/cancel`,
        });
    }

    /**
     * Tạo thanh toán cho dịch vụ
     */
    async createServicePayment(
        createDto: CreateServicePaymentDto,
        userId: string,
    ) {
        const { serviceId, description, frontendReturnUrl, frontendCancelUrl } =
            createDto;

        const user = await this.validateUser(userId);
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId, deletedAt: IsNull(), isActive: true },
            select: ['id', 'price', 'name'],
        });

        if (!service) {
            throw new NotFoundException(
                `Service with ID '${serviceId}' not found or inactive`,
            );
        }

        const finalAmount = this.validateAmount(service.price);
        const itemName = (service.name || 'Dịch vụ').slice(0, 25);
        const shortDescription = (
            description || `Thanh toán: ${itemName}`
        ).slice(0, 25);

        return this.createPaymentLink({
            amount: finalAmount,
            itemName,
            description: shortDescription,
            userId,
            serviceId,
            frontendReturnUrl:
                frontendReturnUrl ||
                `${this.defaultFrontendDomain}/services/payment/success`,
            frontendCancelUrl:
                frontendCancelUrl ||
                `${this.defaultFrontendDomain}/services/payment/cancel`,
        });
    }

    /**
     * Helper method để tạo payment link
     */
    private async createPaymentLink(params: {
        amount: number;
        itemName: string;
        description: string;
        userId: string;
        packageId?: string;
        appointmentId?: string;
        serviceId?: string;
        frontendReturnUrl: string;
        frontendCancelUrl: string;
    }) {
        const {
            amount,
            description,
            userId,
            packageId,
            appointmentId,
            serviceId,
            frontendReturnUrl,
            frontendCancelUrl,
        } = params;

        const orderCode = Math.floor(Math.random() * 1000000);

        const checkoutRequest: CheckoutRequestType = {
            orderCode,
            amount,
            description,
            returnUrl: this.backendReturnUrl,
            cancelUrl: this.backendCancelUrl,
        };

        try {
            const paymentLinkResponse: CheckoutResponseDataType =
                await this.payOS.createPaymentLink(checkoutRequest);

            const payment = this.paymentRepository.create({
                amount,
                paymentMethod: 'PayOS',
                status: PaymentStatusType.PENDING,
                invoiceNumber: orderCode.toString(),
                user: { id: userId } as any,
                ...(packageId && { servicePackage: { id: packageId } as any }),
                ...(appointmentId && {
                    appointment: { id: appointmentId } as any,
                }),
                ...(serviceId && { service: { id: serviceId } as any }),
                gatewayResponse: {
                    ...paymentLinkResponse,
                    frontendReturnUrl,
                    frontendCancelUrl,
                },
            });

            await this.paymentRepository.save(payment);

            return {
                paymentId: payment.id,
                checkoutUrl: paymentLinkResponse.checkoutUrl,
                frontendReturnUrl,
                frontendCancelUrl,
            };
        } catch (error) {
            throw new BadRequestException(
                `Failed to create payment link: ${error.message}`,
            );
        }
    }

    /**
     * Helper methods
     */
    private async validateUser(userId: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: IsNull() },
        });

        if (!user) {
            throw new NotFoundException(`User with ID '${userId}' not found`);
        }

        return user;
    }

    private validateAmount(amount: number): number {
        const finalAmount = Number(parseFloat(amount.toString()).toFixed(2));

        if (isNaN(finalAmount)) {
            throw new BadRequestException(
                'Invalid amount: Unable to parse amount as a number.',
            );
        }

        if (finalAmount < 0.01 || finalAmount > 10000000000) {
            throw new BadRequestException(
                `Invalid amount: ${finalAmount}. Amount must be between 0.01 and 10,000,000,000 VND.`,
            );
        }

        return finalAmount;
    }

    async handleSuccessCallback(orderCode: string) {
        console.log(`Processing success callback for orderCode: ${orderCode}`);

        try {
            const payment = await this.paymentRepository.findOne({
                where: { invoiceNumber: orderCode.toString() },
                relations: ['user', 'servicePackage', 'appointment', 'service'],
            });

            if (!payment) {
                return this.redirectToFrontend(
                    `${this.defaultFrontendDomain}/payment/error`,
                    { code: '01', error: 'Payment not found' },
                );
            }

            if (payment.status !== PaymentStatusType.PENDING) {
                const frontendUrl =
                    payment.gatewayResponse?.frontendReturnUrl ||
                    `${this.defaultFrontendDomain}/payment/error`;
                return this.redirectToFrontend(frontendUrl, {
                    code: '01',
                    error: 'Payment already processed',
                    status: payment.status,
                    orderCode,
                });
            }

            const paymentInfo: PaymentLinkDataType =
                await this.payOS.getPaymentLinkInformation(orderCode);

            if (paymentInfo.status === PayOSPaymentStatus.PAID) {
                payment.status = PaymentStatusType.COMPLETED;
                payment.paymentDate = new Date();
                payment.gatewayResponse = {
                    ...payment.gatewayResponse,
                    payosStatus: PayOSPaymentStatus.PAID,
                    paymentConfirmedAt: new Date().toISOString(),
                    paymentInfo, // Lưu PaymentLinkDataType
                };
                await this.paymentRepository.save(payment);

                // Process business logic
                await this.paymentSubscriptionService.processSuccessfulPayment(
                    payment,
                );

                // Redirect về frontend với success
                const frontendUrl =
                    payment.gatewayResponse?.frontendReturnUrl ||
                    `${this.defaultFrontendDomain}/payment/success`;
                return this.redirectToFrontend(frontendUrl, {
                    code: '00',
                    id: payment.id,
                    cancel: 'false',
                    status: PayOSPaymentStatus.PAID,
                    orderCode,
                    paymentId: payment.id,
                });
            } else {
                const frontendUrl =
                    payment.gatewayResponse?.frontendReturnUrl ||
                    `${this.defaultFrontendDomain}/payment/error`;
                return this.redirectToFrontend(frontendUrl, {
                    code: '01',
                    error: 'Payment not confirmed',
                    status: paymentInfo.status,
                    orderCode,
                });
            }
        } catch (error) {
            console.error('Error processing success callback:', error.message);
            return this.redirectToFrontend(
                `${this.defaultFrontendDomain}/payment/error`,
                { code: '01', error: error.message },
            );
        }
    }

    async handleCancelCallback(orderCode: string) {
        console.log(`Processing cancel callback for orderCode: ${orderCode}`);

        try {
            const payment = await this.paymentRepository.findOne({
                where: { invoiceNumber: orderCode.toString() },
                relations: ['user', 'servicePackage', 'appointment', 'service'],
            });

            if (!payment) {
                return this.redirectToFrontend(
                    `${this.defaultFrontendDomain}/payment/cancel`,
                    { code: '01', error: 'Payment not found', cancel: 'true' },
                );
            }

            if (payment.status !== PaymentStatusType.PENDING) {
                const frontendUrl =
                    payment.gatewayResponse?.frontendCancelUrl ||
                    `${this.defaultFrontendDomain}/payment/cancel`;
                return this.redirectToFrontend(frontendUrl, {
                    code: '01',
                    error: 'Payment already processed',
                    cancel: 'true',
                    status: payment.status,
                    orderCode,
                });
            }

            const paymentInfo: PaymentLinkDataType =
                await this.payOS.getPaymentLinkInformation(orderCode);

            if (paymentInfo.status === PayOSPaymentStatus.CANCELLED) {
                // Update payment status
                payment.status = PaymentStatusType.CANCELLED;
                payment.gatewayResponse = {
                    ...payment.gatewayResponse,
                    payosStatus: PayOSPaymentStatus.CANCELLED,
                    cancelledAt: new Date().toISOString(),
                    cancellationReason:
                        paymentInfo.cancellationReason || 'Cancelled by user',
                    paymentInfo,
                };
                await this.paymentRepository.save(payment);

                // Redirect về frontend với cancel status
                const frontendUrl =
                    payment.gatewayResponse?.frontendCancelUrl ||
                    `${this.defaultFrontendDomain}/payment/cancel`;
                return this.redirectToFrontend(frontendUrl, {
                    code: '00',
                    id: payment.id,
                    cancel: 'true',
                    status: PayOSPaymentStatus.CANCELLED,
                    orderCode,
                    paymentId: payment.id,
                });
            } else {
                const frontendUrl =
                    payment.gatewayResponse?.frontendCancelUrl ||
                    `${this.defaultFrontendDomain}/payment/cancel`;
                return this.redirectToFrontend(frontendUrl, {
                    code: '01',
                    error: 'Payment status mismatch',
                    cancel: 'true',
                    status: paymentInfo.status,
                    orderCode,
                });
            }
        } catch (error) {
            console.error('Error processing cancel callback:', error.message);
            return this.redirectToFrontend(
                `${this.defaultFrontendDomain}/payment/cancel`,
                { code: '01', error: error.message, cancel: 'true' },
            );
        }
    }

    /**
     * Helper method để redirect về frontend với query params
     */
    private redirectToFrontend(baseUrl: string, params: Record<string, any>) {
        const url = new URL(baseUrl);
        Object.keys(params).forEach((key) => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key].toString());
            }
        });

        return {
            redirectUrl: url.toString(),
            statusCode: 302,
        };
    }

    async findAll() {
        return this.paymentRepository.find({
            relations: [
                'user',
                'servicePackage',
                'appointment',
                'service',
                'packageSubscriptions',
            ],
        });
    }

    async findOne(id: string) {
        console.log(`Gọi findOne với id: ${id}`);
        if (!isUUID(id)) {
            throw new BadRequestException(`UUID không hợp lệ: ${id}`);
        }
        const payment = await this.paymentRepository.findOne({
            where: { id },
            relations: [
                'user',
                'servicePackage',
                'appointment',
                'service',
                'packageSubscriptions',
            ],
        });
        if (!payment) {
            throw new NotFoundException(
                `Không tìm thấy thanh toán với ID '${id}'`,
            );
        }
        return payment;
    }

    async remove(id: string) {
        const payment = await this.paymentRepository.findOne({ where: { id } });
        if (!payment) {
            throw new Error('Payment not found');
        }
        return this.paymentRepository.softDelete({ id });
    }

    async findOneByInvoiceNumber(invoiceNumber: string) {
        return this.paymentRepository.findOne({
            where: { invoiceNumber },
            relations: [
                'user',
                'servicePackage',
                'appointment',
                'service',
                'packageSubscriptions',
            ],
        });
    }

    /**
     * Lấy danh sách cuộc hẹn chờ thanh toán của user
     */
    async getPendingAppointments(userId: string) {
        const appointments = await this.appointmentRepository.find({
            where: {
                user: { id: userId },
                deletedAt: IsNull(),
                // Chỉ lấy các appointment chưa có payment hoặc payment chưa thành công
            },
            relations: ['services', 'consultant'],
            select: [
                'id',
                'appointmentDate',
                'appointmentLocation',
                'notes',
                'fixedPrice',
                'status',
            ],
            order: { appointmentDate: 'ASC' },
        });

        // Filter appointments that need payment
        const pendingPaymentAppointments: Appointment[] = [];
        for (const appointment of appointments) {
            const existingPayment = await this.paymentRepository.findOne({
                where: {
                    appointment: { id: appointment.id },
                    status: PaymentStatusType.COMPLETED,
                },
            });

            if (!existingPayment) {
                pendingPaymentAppointments.push(appointment);
            }
        }

        return pendingPaymentAppointments;
    }

    /**
     * Thống kê thanh toán của user
     */
    async getUserPaymentStats(userId: string) {
        // Tổng số tiền đã thanh toán
        const totalPaidResult = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('SUM(payment.amount)', 'total')
            .where('payment.user.id = :userId', { userId })
            .andWhere('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .getRawOne();

        // Số lượng thanh toán theo trạng thái
        const paymentsByStatus = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('payment.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('payment.user.id = :userId', { userId })
            .groupBy('payment.status')
            .getRawMany();

        // Số gói đã mua
        const packagesPurchased = await this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoin('payment.servicePackage', 'package')
            .where('payment.user.id = :userId', { userId })
            .andWhere('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .andWhere('payment.servicePackage IS NOT NULL')
            .getCount();

        // Số cuộc hẹn đã thanh toán
        const appointmentsPaid = await this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoin('payment.appointment', 'appointment')
            .where('payment.user.id = :userId', { userId })
            .andWhere('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .andWhere('payment.appointment IS NOT NULL')
            .getCount();

        return {
            totalAmountPaid: Number(totalPaidResult?.total) || 0,
            paymentsByStatus: paymentsByStatus.reduce((acc, item) => {
                acc[item.status] = Number(item.count);
                return acc;
            }, {}),
            packagesPurchased,
            appointmentsPaid,
        };
    }

    async verifyWebhook(webhookData: WebhookType) {
        // Step 1: Verify signature
        let verifiedData: WebhookDataType;
        try {
            // verifyPaymentWebhookData trả về WebhookDataType hoặc throw error nếu signature invalid
            verifiedData = this.payOS.verifyPaymentWebhookData(webhookData);
        } catch (signatureError) {
            console.error('Invalid webhook signature:', signatureError.message);
            throw new BadRequestException('Chữ ký webhook không hợp lệ');
        }

        // Step 2: Process business logic
        try {
            // Sử dụng verifiedData (WebhookDataType) thay vì webhookData.data
            const { orderCode } = verifiedData;

            const payment = await this.paymentRepository.findOne({
                where: { invoiceNumber: orderCode.toString() },
                relations: [
                    'user',
                    'servicePackage',
                    'appointment',
                    'service',
                    'packageSubscriptions',
                ],
            });

            if (!payment) {
                throw new NotFoundException(
                    `Không tìm thấy thanh toán với orderCode '${orderCode}'`,
                );
            }

            // Lấy thông tin thanh toán từ PayOS để kiểm tra status
            const paymentInfo: PaymentLinkDataType =
                await this.payOS.getPaymentLinkInformation(
                    orderCode.toString(),
                );
            const payosStatus = paymentInfo.status as PayOSPaymentStatus;

            if (payosStatus === PayOSPaymentStatus.PAID) {
                if (payment.status !== PaymentStatusType.PENDING) {
                    throw new BadRequestException(
                        `Thanh toán đã ở trạng thái ${payment.status}`,
                    );
                }
                payment.status = PaymentStatusType.COMPLETED;
                payment.paymentDate = new Date();
                payment.gatewayResponse = {
                    ...payment.gatewayResponse,
                    payosStatus: PayOSPaymentStatus.PAID,
                    paymentConfirmedAt: new Date().toISOString(),
                    webhookData: verifiedData, // Lưu verified webhook data
                    paymentInfo, // Lưu payment info từ getPaymentLinkInformation
                };
                await this.paymentRepository.save(payment);
                await this.paymentSubscriptionService.processSuccessfulPayment(
                    payment,
                );
            } else if (payosStatus === PayOSPaymentStatus.CANCELLED) {
                if (payment.status !== PaymentStatusType.PENDING) {
                    throw new BadRequestException(
                        `Thanh toán đã ở trạng thái ${payment.status}`,
                    );
                }
                payment.status = PaymentStatusType.CANCELLED;
                payment.gatewayResponse = {
                    ...payment.gatewayResponse,
                    payosStatus: PayOSPaymentStatus.CANCELLED,
                    cancelledAt: new Date().toISOString(),
                    cancellationReason:
                        paymentInfo.cancellationReason ||
                        'Hủy bởi webhook PayOS',
                    webhookData: verifiedData,
                    paymentInfo,
                };
                await this.paymentRepository.save(payment);
            }

            return {
                success: true,
                message: 'Webhook processed successfully',
                payment,
            };
        } catch (error) {
            console.error(
                'Lỗi xử lý webhook business logic:',
                error.message,
                error.stack,
            );
            throw new BadRequestException(
                `Không thể xử lý webhook: ${error.message}`,
            );
        }
    }

    /**
     * Hủy thanh toán (chỉ cho phép khi status = PENDING)
     */
    async cancelPayment(id: string, cancelDto?: CancelPaymentDto) {
        const payment = await this.findOne(id);

        // Chỉ cho phép cancel khi PENDING
        if (payment.status !== PaymentStatusType.PENDING) {
            throw new BadRequestException(
                `Không thể hủy thanh toán với trạng thái ${payment.status}. Chỉ có thể hủy thanh toán đang chờ xử lý.`,
            );
        }

        try {
            // Thử cancel trên PayOS với orderCode
            let payosResult: PaymentLinkDataType | null = null;

            // Prepare cancellation reason (ensure it's always a string)
            const cancellationReason =
                cancelDto?.cancellationReason || 'Hủy bởi người dùng';

            try {
                // Validate invoiceNumber exists
                if (!payment.invoiceNumber) {
                    throw new Error(
                        'Payment không có orderCode để hủy trên PayOS',
                    );
                }

                const orderCodeNumber = parseInt(payment.invoiceNumber);

                // Validate orderCode is a valid number
                if (isNaN(orderCodeNumber)) {
                    throw new Error(
                        `OrderCode không hợp lệ: ${payment.invoiceNumber}`,
                    );
                }

                // Call PayOS cancelPaymentLink API
                payosResult = await this.payOS.cancelPaymentLink(
                    orderCodeNumber,
                    cancellationReason,
                );

                console.log('Đã hủy thành công trên PayOS:', payosResult);
            } catch (payosError) {
                console.warn('Không thể hủy trên PayOS:', payosError.message);
                // Vẫn tiếp tục hủy local nếu PayOS fail
            }

            // Update local payment status
            payment.status = PaymentStatusType.CANCELLED;
            payment.gatewayResponse = {
                ...payment.gatewayResponse,
                payosStatus: PayOSPaymentStatus.CANCELLED,
                cancelledAt: new Date().toISOString(),
                cancellationReason, // Use the same variable
                cancelledBy: 'user', // Distinguish from webhook cancellation
                payosCancelResult: payosResult, // Lưu kết quả từ PayOS nếu có
            };

            await this.paymentRepository.save(payment);

            return {
                success: true,
                message: 'Hủy thanh toán thành công',
                payment,
            };
        } catch (error) {
            throw new BadRequestException(
                `Không thể hủy thanh toán: ${error.message}`,
            );
        }
    }

    /**
     * Lấy payment với check ownership (để đảm bảo user chỉ có thể thao tác với payment của mình)
     */
    async findPaymentByIdAndUser(paymentId: string, userId: string) {
        const payment = await this.paymentRepository.findOne({
            where: {
                id: paymentId,
                user: { id: userId },
                deletedAt: IsNull(),
            },
            relations: ['user', 'servicePackage', 'appointment', 'service'],
        });

        if (!payment) {
            throw new NotFoundException(
                `Không tìm thấy thanh toán với ID '${paymentId}' hoặc bạn không có quyền truy cập`,
            );
        }

        return payment;
    }

    /**
     * Lấy danh sách payments của user với filter status
     */
    async getUserPayments(userId: string, status?: PaymentStatusType) {
        const payments = await this.paymentRepository.find({
            where: {
                user: { id: userId },
                deletedAt: IsNull(),
                ...(status && { status }),
            },
            relations: ['servicePackage', 'appointment', 'service'],
            order: { createdAt: SortOrder.DESC },
            select: {
                id: true,
                amount: true,
                paymentMethod: true,
                status: true,
                paymentDate: true,
                invoiceNumber: true,
                createdAt: true,
                updatedAt: true,
                servicePackage: {
                    id: true,
                    name: true,
                    description: true,
                },
                appointment: {
                    id: true,
                    appointmentDate: true,
                    notes: true,
                },
                service: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        });

        return {
            success: true,
            data: payments,
            message: 'Lấy danh sách thanh toán thành công',
        };
    }

    /**
     * Cancel payment với check ownership
     */
    async cancelPaymentByUser(
        paymentId: string,
        userId: string,
        cancelDto?: CancelPaymentDto,
    ) {
        // Tìm payment và check ownership
        const payment = await this.findPaymentByIdAndUser(paymentId, userId);

        // Delegate to existing cancel method
        return this.cancelPayment(payment.id, cancelDto);
    }
}
