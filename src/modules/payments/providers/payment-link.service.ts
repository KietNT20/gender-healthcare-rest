import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import {
    CheckoutRequestType,
    CheckoutResponseDataType,
} from '@payos/node/lib/type';
import { PaymentStatusType } from 'src/enums';
import { CreateAppointmentPaymentDto } from '../dto/create-appointment-payment.dto';
import { CreatePackagePaymentDto } from '../dto/create-package-payment.dto';
import { CreateServicePaymentDto } from '../dto/create-service-payment.dto';
import { GatewayResponseType } from '../types/gateway-response.type';
import { PaymentRepositoryService } from './payment-repository.service';
import { PaymentValidationService } from './payment-validation.service';
import { PayOSService } from './payos.service';

@Injectable()
export class PaymentLinkService {
    private readonly defaultFrontendDomain: string;
    private readonly backendReturnUrl: string;
    private readonly backendCancelUrl: string;

    constructor(
        private readonly payOSService: PayOSService,
        private readonly paymentRepositoryService: PaymentRepositoryService,
        private readonly paymentValidationService: PaymentValidationService,
    ) {
        this.backendReturnUrl = process.env.BACKEND_RETURN_URL as string;
        this.backendCancelUrl = process.env.BACKEND_CANCEL_URL as string;
        this.defaultFrontendDomain =
            (process.env.FRONTEND_URL as string) ||
            'http://localhost:3000' ||
            'http://localhost:5173';

        if (!this.backendReturnUrl || !this.backendCancelUrl) {
            throw new InternalServerErrorException(
                'Missing Back-end return or cancel URLs',
            );
        }
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

        const user = await this.paymentValidationService.validateUser(userId);
        const servicePackage =
            await this.paymentRepositoryService.findPackageById(packageId);

        const finalAmount = this.paymentValidationService.validateAmount(
            servicePackage.price,
        );
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

        const user = await this.paymentValidationService.validateUser(userId);
        const { appointment, totalPrice } =
            await this.paymentRepositoryService.findAppointmentWithPrice(
                appointmentId,
                user,
            );

        const finalAmount = this.paymentValidationService.validateAmount(
            appointment.fixedPrice || totalPrice,
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

        const user = await this.paymentValidationService.validateUser(userId);
        const service =
            await this.paymentRepositoryService.findServiceById(serviceId);

        const finalAmount = this.paymentValidationService.validateAmount(
            service.price,
        );
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

        const orderCode = this.payOSService.generateOrderCode();

        const checkoutRequest: CheckoutRequestType = {
            orderCode,
            amount,
            description,
            returnUrl: this.backendReturnUrl,
            cancelUrl: this.backendCancelUrl,
        };

        try {
            const paymentLinkResponse: CheckoutResponseDataType =
                await this.payOSService.createPaymentLink(checkoutRequest);

            const gatewayResponse: GatewayResponseType = {
                ...paymentLinkResponse,
                frontendReturnUrl,
                frontendCancelUrl,
            };

            const paymentData = {
                amount,
                paymentMethod: 'PayOS',
                status: PaymentStatusType.PENDING,
                invoiceNumber: orderCode.toString(),
                userId,
                packageId,
                appointmentId,
                serviceId,
                gatewayResponse,
            };

            const payment =
                await this.paymentRepositoryService.createPayment(paymentData);

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

    getPayOSService() {
        return this.payOSService;
    }

    getDefaultFrontendDomain() {
        return this.defaultFrontendDomain;
    }
}
