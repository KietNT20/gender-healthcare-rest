import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    PaymentLinkDataType,
    WebhookDataType,
    WebhookType,
} from '@payos/node/lib/type';
import { PaymentStatusType } from 'src/enums';
import { CancelPaymentDto } from '../dto/cancel-payment.dto';
import { PayOSPaymentStatus } from '../enums/payos.enum';
import { PaymentSubscriptionService } from '../payment-subscription.service';
import { PaymentRepositoryService } from './payment-repository.service';
import { PaymentValidationService } from './payment-validation.service';
import { PayOSService } from './payos.service';

@Injectable()
export class PaymentCallbackService {
    constructor(
        private readonly payOSService: PayOSService,
        private readonly paymentRepositoryService: PaymentRepositoryService,
        private readonly paymentValidationService: PaymentValidationService,
        private readonly paymentSubscriptionService: PaymentSubscriptionService,
    ) {}

    /**
     * Xử lý success callback từ PayOS
     */
    async handleSuccessCallback(
        orderCode: string,
        defaultFrontendDomain: string,
    ) {
        console.log(`Processing success callback for orderCode: ${orderCode}`);

        try {
            const payment =
                await this.paymentRepositoryService.findPaymentByInvoiceNumber(
                    orderCode,
                );

            if (!payment) {
                return this.paymentValidationService.createRedirectResponse(
                    `${defaultFrontendDomain}/payment/error`,
                    { code: '01', error: 'Payment not found' },
                );
            }

            if (payment.status !== PaymentStatusType.PENDING) {
                const frontendUrl =
                    payment.gatewayResponse?.frontendReturnUrl ||
                    `${defaultFrontendDomain}/payment/error`;
                return this.paymentValidationService.createRedirectResponse(
                    frontendUrl,
                    {
                        code: '01',
                        error: 'Payment already processed',
                        status: payment.status,
                        orderCode,
                    },
                );
            }

            const paymentInfo: PaymentLinkDataType =
                await this.payOSService.getPaymentLinkInformation(orderCode);

            if (paymentInfo.status === PayOSPaymentStatus.PAID) {
                payment.status = PaymentStatusType.COMPLETED;
                payment.paymentDate = new Date();
                payment.gatewayResponse = {
                    ...payment.gatewayResponse,
                    payosStatus: PayOSPaymentStatus.PAID,
                    paymentConfirmedAt: new Date().toISOString(),
                    paymentInfo,
                };
                await this.paymentRepositoryService.updatePayment(payment);

                // Process business logic
                await this.paymentSubscriptionService.processSuccessfulPayment(
                    payment,
                );

                // Redirect về frontend với success
                const frontendUrl =
                    payment.gatewayResponse?.frontendReturnUrl ||
                    `${defaultFrontendDomain}/payment/success`;
                return this.paymentValidationService.createRedirectResponse(
                    frontendUrl,
                    {
                        code: '00',
                        id: payment.id,
                        cancel: 'false',
                        status: PayOSPaymentStatus.PAID,
                        orderCode,
                        paymentId: payment.id,
                    },
                );
            } else {
                const frontendUrl =
                    payment.gatewayResponse?.frontendReturnUrl ||
                    `${defaultFrontendDomain}/payment/error`;
                return this.paymentValidationService.createRedirectResponse(
                    frontendUrl,
                    {
                        code: '01',
                        error: 'Payment not confirmed',
                        status: paymentInfo.status,
                        orderCode,
                    },
                );
            }
        } catch (error) {
            console.error('Error processing success callback:', error.message);
            return this.paymentValidationService.createRedirectResponse(
                `${defaultFrontendDomain}/payment/error`,
                { code: '01', error: error.message },
            );
        }
    }

    /**
     * Xử lý cancel callback từ PayOS
     */
    async handleCancelCallback(
        orderCode: string,
        defaultFrontendDomain: string,
    ) {
        console.log(`Processing cancel callback for orderCode: ${orderCode}`);

        try {
            const payment =
                await this.paymentRepositoryService.findPaymentByInvoiceNumber(
                    orderCode,
                );

            if (!payment) {
                return this.paymentValidationService.createRedirectResponse(
                    `${defaultFrontendDomain}/payment/cancel`,
                    { code: '01', error: 'Payment not found', cancel: 'true' },
                );
            }

            if (payment.status !== PaymentStatusType.PENDING) {
                const frontendUrl =
                    payment.gatewayResponse?.frontendCancelUrl ||
                    `${defaultFrontendDomain}/payment/cancel`;
                return this.paymentValidationService.createRedirectResponse(
                    frontendUrl,
                    {
                        code: '01',
                        error: 'Payment already processed',
                        cancel: 'true',
                        status: payment.status,
                        orderCode,
                    },
                );
            }

            const paymentInfo: PaymentLinkDataType =
                await this.payOSService.getPaymentLinkInformation(orderCode);

            if (paymentInfo.status === PayOSPaymentStatus.CANCELLED) {
                payment.status = PaymentStatusType.CANCELLED;
                payment.gatewayResponse = {
                    ...payment.gatewayResponse,
                    payosStatus: PayOSPaymentStatus.CANCELLED,
                    cancelledAt: new Date().toISOString(),
                    cancellationReason:
                        paymentInfo.cancellationReason || 'Cancelled by user',
                    paymentInfo,
                };
                await this.paymentRepositoryService.updatePayment(payment);

                const frontendUrl =
                    payment.gatewayResponse?.frontendCancelUrl ||
                    `${defaultFrontendDomain}/payment/cancel`;
                return this.paymentValidationService.createRedirectResponse(
                    frontendUrl,
                    {
                        code: '00',
                        id: payment.id,
                        cancel: 'true',
                        status: PayOSPaymentStatus.CANCELLED,
                        orderCode,
                        paymentId: payment.id,
                    },
                );
            } else {
                const frontendUrl =
                    payment.gatewayResponse?.frontendCancelUrl ||
                    `${defaultFrontendDomain}/payment/cancel`;
                return this.paymentValidationService.createRedirectResponse(
                    frontendUrl,
                    {
                        code: '01',
                        error: 'Payment status mismatch',
                        cancel: 'true',
                        status: paymentInfo.status,
                        orderCode,
                    },
                );
            }
        } catch (error) {
            console.error('Error processing cancel callback:', error.message);
            return this.paymentValidationService.createRedirectResponse(
                `${defaultFrontendDomain}/payment/cancel`,
                { code: '01', error: error.message, cancel: 'true' },
            );
        }
    }

    /**
     * Xác thực và xử lý webhook từ PayOS
     */
    async verifyWebhook(webhookData: WebhookType) {
        // Step 1: Verify signature
        let verifiedData: WebhookDataType;
        try {
            verifiedData =
                this.payOSService.verifyPaymentWebhookData(webhookData);
        } catch (signatureError) {
            console.error('Invalid webhook signature:', signatureError.message);
            throw new BadRequestException('Chữ ký webhook không hợp lệ');
        }

        // Step 2: Process business logic
        try {
            const { orderCode } = verifiedData;

            const payment =
                await this.paymentRepositoryService.findPaymentByInvoiceNumber(
                    orderCode.toString(),
                );

            if (!payment) {
                throw new NotFoundException(
                    `Không tìm thấy thanh toán với orderCode '${orderCode}'`,
                );
            }

            const paymentInfo: PaymentLinkDataType =
                await this.payOSService.getPaymentLinkInformation(
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
                    webhookData: verifiedData,
                    paymentInfo,
                };
                await this.paymentRepositoryService.updatePayment(payment);
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
                await this.paymentRepositoryService.updatePayment(payment);
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
     * Hủy thanh toán qua PayOS
     */
    async cancelPayment(paymentId: string, cancelDto: CancelPaymentDto) {
        const payment =
            await this.paymentRepositoryService.findPaymentById(paymentId);

        if (payment.status !== PaymentStatusType.PENDING) {
            throw new BadRequestException(
                `Không thể hủy thanh toán với trạng thái ${payment.status}. Chỉ có thể hủy thanh toán đang chờ xử lý.`,
            );
        }

        try {
            let payosResult: PaymentLinkDataType | null = null;
            const cancellationReason =
                this.paymentValidationService.validateCancellationReason(
                    cancelDto?.cancellationReason,
                );

            try {
                const invoiceNumber =
                    this.paymentValidationService.validateInvoiceNumber(
                        payment.invoiceNumber,
                    );
                const orderCodeNumber =
                    this.paymentValidationService.validateOrderCode(
                        invoiceNumber,
                    );

                payosResult = await this.payOSService.cancelPaymentLink(
                    orderCodeNumber,
                    cancellationReason,
                );
                console.log('Đã hủy thành công trên PayOS:', payosResult);
            } catch (payosError) {
                console.warn('Không thể hủy trên PayOS:', payosError.message);
            }

            payment.status = PaymentStatusType.CANCELLED;
            payment.gatewayResponse = {
                ...payment.gatewayResponse,
                payosStatus: PayOSPaymentStatus.CANCELLED,
                cancelledAt: new Date().toISOString(),
                cancellationReason,
                cancelledBy: 'user',
                payosCancelResult: payosResult,
            };

            await this.paymentRepositoryService.updatePayment(payment);

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
}
