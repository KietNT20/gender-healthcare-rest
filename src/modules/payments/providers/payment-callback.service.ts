import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import {
    PaymentLinkDataType,
    WebhookDataType,
    WebhookType,
} from '@payos/node/lib/type';
import { PaymentStatusType } from 'src/enums';
import { CancelPaymentDto } from '../dto/cancel-payment.dto';
import { Payment } from '../entities/payment.entity';
import { PayOSPaymentStatus } from '../enums/payos.enum';
import { PaymentSubscriptionService } from '../payment-subscription.service';
import { GatewayResponseType } from '../types/gateway-response.type';
import { PaymentRepositoryService } from './payment-repository.service';
import { PaymentValidationService } from './payment-validation.service';
import { PayOSService } from './payos.service';

@Injectable()
export class PaymentCallbackService {
    private readonly logger = new Logger(PaymentCallbackService.name);

    constructor(
        private readonly payOSService: PayOSService,
        private readonly paymentRepositoryService: PaymentRepositoryService,
        private readonly paymentValidationService: PaymentValidationService,
        private readonly paymentSubscriptionService: PaymentSubscriptionService,
    ) {}

    /**
     * [CALLBACK] Xử lý khi người dùng được chuyển hướng về sau khi thanh toán.
     * Nhiệm vụ chính là chuyển hướng người dùng về trang frontend chính xác.
     * KHÔNG nên là nơi cập nhật trạng thái thanh toán cuối cùng.
     */
    async handleRedirectCallback(
        orderCode: string,
        isCancelled: boolean,
        defaultFrontendDomain: string,
    ) {
        const payment =
            await this.paymentRepositoryService.findPaymentByInvoiceNumber(
                orderCode,
            );

        if (!payment) {
            return this.paymentValidationService.createRedirectResponse(
                `${defaultFrontendDomain}/payment/error`,
                { code: '02', error: 'Payment not found' }, // 02 = INVALID_PARAM
            );
        }

        const successUrl = payment.gatewayResponse.frontendReturnUrl;
        const cancelUrl = payment.gatewayResponse.frontendCancelUrl;

        // Nếu người dùng từ trang cancel của PayOS quay về.
        if (isCancelled) {
            if (payment.status === PaymentStatusType.PENDING) {
                await this.processCancelledPayment(payment, {
                    reason: 'User returned to cancel URL',
                    cancelledBy: 'USER',
                });
            }
            return this.paymentValidationService.createRedirectResponse(
                cancelUrl,
                {
                    code: '00',
                    status: 'CANCELLED',
                    paymentId: payment.id,
                },
            );
        }

        // Nếu người dùng từ trang success của PayOS quay về
        // Ưu tiên chuyển hướng dựa trên trạng thái đã được webhook cập nhật
        if (payment.status === PaymentStatusType.COMPLETED) {
            return this.paymentValidationService.createRedirectResponse(
                successUrl,
                {
                    code: '00',
                    status: 'COMPLETED',
                    paymentId: payment.id,
                },
            );
        }

        // Nếu webhook chậm, ta chủ động kiểm tra lại trạng thái với PayOS
        try {
            const paymentInfo =
                await this.payOSService.getPaymentLinkInformation(orderCode);
            if (paymentInfo.status === PayOSPaymentStatus.PAID) {
                await this.processSuccessfulPayment(payment, { paymentInfo });
                return this.paymentValidationService.createRedirectResponse(
                    successUrl,
                    { code: '00', status: 'PAID' },
                );
            } else if (paymentInfo.status === PayOSPaymentStatus.CANCELLED) {
                return this.paymentValidationService.createRedirectResponse(
                    cancelUrl,
                    { code: '01', status: 'CANCELLED' }, // 01 = FAILED
                );
            } else if (paymentInfo.status === PayOSPaymentStatus.PROCESSING) {
                return this.paymentValidationService.createRedirectResponse(
                    `${defaultFrontendDomain}/payment/processing?orderId=${orderCode}`,
                    { code: '01', status: 'PROCESSING' }, // 01 = FAILED (chưa thành công)
                );
            }
        } catch (error) {
            this.logger.error('Callback verification failed:', error.message);
        }

        // Mặc định chuyển về trang lỗi nếu không xác định được
        return this.paymentValidationService.createRedirectResponse(
            `${defaultFrontendDomain}/payment/error`,
            { code: '02', error: 'Payment status could not be confirmed.' }, // 02 = INVALID_PARAM
        );
    }

    /**
     * [WEBHOOK] Xác thực và xử lý webhook từ máy chủ PayOS.
     * Đây là nguồn tin cậy DUY NHẤT để đánh dấu thanh toán là THÀNH CÔNG.
     */
    async verifyAndProcessWebhook(webhookPayload: WebhookType) {
        try {
            const webhookData =
                this.payOSService.verifyPaymentWebhookData(webhookPayload);
            const { orderCode } = webhookData;

            const payment =
                await this.paymentRepositoryService.findPaymentByInvoiceNumber(
                    orderCode.toString(),
                );

            if (!payment) {
                throw new NotFoundException(
                    `Payment not found for orderCode '${orderCode}'`,
                );
            }

            if (payment.status !== PaymentStatusType.PENDING) {
                console.log(
                    `Webhook received for an already processed payment: ${orderCode}, status: ${payment.status}`,
                );
                return { success: true, message: 'Payment already processed' };
            }

            const paymentInfo =
                await this.payOSService.getPaymentLinkInformation(
                    orderCode.toString(),
                );

            if (paymentInfo.status === PayOSPaymentStatus.PAID) {
                await this.processSuccessfulPayment(payment, {
                    webhookData,
                    paymentInfo,
                });
            } else if (paymentInfo.status === PayOSPaymentStatus.CANCELLED) {
                await this.processCancelledPayment(payment, {
                    reason:
                        paymentInfo.cancellationReason ||
                        'Cancelled via PayOS webhook',
                    cancelledBy: 'WEBHOOK',
                    webhookData,
                    paymentInfo,
                });
            } else if (paymentInfo.status === PayOSPaymentStatus.PROCESSING) {
                // Payment is still being processed, update gateway response but keep payment pending
                await this.processProcessingPayment(payment, {
                    webhookData,
                    paymentInfo,
                });
            } else {
                // Handle PENDING or any other unknown status
                payment.gatewayResponse.payosStatus =
                    paymentInfo.status as PayOSPaymentStatus;
                payment.gatewayResponse.webhookData = webhookData;
                payment.gatewayResponse.paymentInfo = paymentInfo;
                await this.paymentRepositoryService.updatePayment(payment);
                this.logger.log(
                    `Payment ${orderCode} status: ${paymentInfo.status}`,
                );
            }

            return { success: true, message: 'Webhook processed successfully' };
        } catch (error) {
            console.error(
                `Webhook processing error: ${error.message}`,
                error.stack,
            );
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException(
                `Webhook processing failed: ${error.message}`,
            );
        }
    }

    /**
     * [API] Hủy thanh toán từ phía người dùng hoặc admin.
     */
    async cancelPaymentFromSystem(
        paymentId: string,
        cancelDto: CancelPaymentDto,
    ) {
        const payment =
            await this.paymentRepositoryService.findPaymentById(paymentId);

        if (payment.status !== PaymentStatusType.PENDING) {
            throw new BadRequestException(
                `Cannot cancel a payment with status '${payment.status}'.`,
            );
        }

        const reason = this.paymentValidationService.validateCancellationReason(
            cancelDto.cancellationReason,
        );
        let payosCancelResult: PaymentLinkDataType | null = null;

        try {
            // Validate invoice number and order code
            const invoiceNumber =
                this.paymentValidationService.validateInvoiceNumber(
                    payment.invoiceNumber,
                );
            const orderCodeNumber =
                this.paymentValidationService.validateOrderCode(invoiceNumber);
            payosCancelResult = await this.payOSService.cancelPaymentLink(
                orderCodeNumber,
                reason,
            );
        } catch (payosError) {
            console.warn(
                `Could not cancel on PayOS for order ${payment.invoiceNumber}, but proceeding to cancel in local system. Error: ${payosError.message}`,
            );
        }

        await this.processCancelledPayment(payment, {
            reason,
            cancelledBy: 'SYSTEM',
            payosCancelResult,
        });

        return {
            success: true,
            message: 'Payment cancelled successfully',
            payment,
        };
    }

    private async processSuccessfulPayment(
        payment: Payment,
        data: {
            webhookData?: WebhookDataType;
            paymentInfo?: PaymentLinkDataType;
        },
    ) {
        if (
            payment.status !== PaymentStatusType.PENDING &&
            payment.status !== PaymentStatusType.PROCESSING
        )
            return;

        payment.status = PaymentStatusType.COMPLETED;
        payment.paymentDate = new Date();
        payment.gatewayResponse.payosStatus = PayOSPaymentStatus.PAID;
        payment.gatewayResponse.paymentConfirmedAt = new Date().toISOString();
        payment.gatewayResponse.webhookData = data.webhookData;
        payment.gatewayResponse.paymentInfo = data.paymentInfo;

        await this.paymentRepositoryService.updatePayment(payment);
        await this.paymentSubscriptionService.processSuccessfulPayment(payment);
    }

    private async processCancelledPayment(
        payment: Payment,
        data: {
            reason: string;
            cancelledBy: GatewayResponseType['cancelledBy'];
            webhookData?: WebhookDataType;
            paymentInfo?: PaymentLinkDataType;
            payosCancelResult?: PaymentLinkDataType | null;
        },
    ) {
        if (
            payment.status !== PaymentStatusType.PENDING &&
            payment.status !== PaymentStatusType.PROCESSING
        )
            return;

        payment.status = PaymentStatusType.CANCELLED;
        payment.gatewayResponse.payosStatus = PayOSPaymentStatus.CANCELLED;
        payment.gatewayResponse.cancelledAt = new Date().toISOString();
        payment.gatewayResponse.cancellationReason = data.reason;
        payment.gatewayResponse.cancelledBy = data.cancelledBy;
        payment.gatewayResponse.webhookData = data.webhookData;
        payment.gatewayResponse.paymentInfo = data.paymentInfo;
        payment.gatewayResponse.payosCancelResult = data.payosCancelResult;

        await this.paymentRepositoryService.updatePayment(payment);
    }

    private async processProcessingPayment(
        payment: Payment,
        data: {
            webhookData?: WebhookDataType;
            paymentInfo?: PaymentLinkDataType;
        },
    ) {
        // Chỉ chuyển từ PENDING sang PROCESSING, không chuyển ngược lại
        if (payment.status === PaymentStatusType.PENDING) {
            payment.status = PaymentStatusType.PROCESSING;
        }

        payment.gatewayResponse.payosStatus = PayOSPaymentStatus.PROCESSING;
        payment.gatewayResponse.webhookData = data.webhookData;
        payment.gatewayResponse.paymentInfo = data.paymentInfo;

        await this.paymentRepositoryService.updatePayment(payment);
        this.logger.log(`Payment ${payment.id} is being processed by PayOS`);
    }
}
