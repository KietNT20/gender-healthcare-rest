import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import {
    CheckoutRequestType,
    CheckoutResponseDataType,
    PaymentLinkDataType,
    WebhookDataType,
    WebhookType,
} from '@payos/node/lib/type';
import PayOS = require('@payos/node');

@Injectable()
export class PayOSService {
    private readonly logger = new Logger(PayOSService.name);
    private payOS: PayOS;

    constructor() {
        this.initializePayOS();
    }

    private initializePayOS() {
        const clientId = process.env.PAYOS_CLIENT_ID;
        const apiKey = process.env.PAYOS_API_KEY;
        const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

        if (!clientId || !apiKey || !checksumKey) {
            throw new InternalServerErrorException('Missing PayOS credentials');
        }

        this.payOS = new PayOS(clientId, apiKey, checksumKey);
        this.logger.log('PayOS service initialized successfully');
    }

    /**
     * Tạo link thanh toán cho dữ liệu đơn hàng
     */
    async createPaymentLink(
        request: CheckoutRequestType,
    ): Promise<CheckoutResponseDataType> {
        try {
            this.logger.debug(
                `Creating payment link for order: ${request.orderCode}`,
            );

            const result = await this.payOS.createPaymentLink(request);

            this.logger.log(
                `Payment link created successfully for order: ${request.orderCode}`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `Failed to create payment link for order: ${request.orderCode}`,
                error.stack,
            );
            throw new Error(`Failed to create payment link: ${error.message}`);
        }
    }

    /**
     * Lấy thông tin thanh toán của đơn hàng đã tạo link thanh toán
     */
    async getPaymentLinkInformation(
        orderCode: string | number,
    ): Promise<PaymentLinkDataType> {
        try {
            this.logger.debug(`Getting payment info for order: ${orderCode}`);

            const result =
                await this.payOS.getPaymentLinkInformation(orderCode);

            this.logger.log(
                `Payment info retrieved successfully for order: ${orderCode}`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `Failed to get payment info for order: ${orderCode}`,
                error.stack,
            );
            throw new Error(
                `Failed to get payment information: ${error.message}`,
            );
        }
    }

    /**
     * Hủy link thanh toán của đơn hàng
     */
    async cancelPaymentLink(
        orderCode: string | number,
        cancellationReason: string,
    ): Promise<PaymentLinkDataType> {
        try {
            this.logger.debug(
                `Canceling payment link for order: ${orderCode}, reason: ${cancellationReason}`,
            );

            const result = await this.payOS.cancelPaymentLink(
                orderCode,
                cancellationReason,
            );

            this.logger.log(
                `Payment link canceled successfully for order: ${orderCode}`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `Failed to cancel payment link for order: ${orderCode}`,
                error.stack,
            );
            throw new Error(`Failed to cancel payment link: ${error.message}`);
        }
    }

    /**
     * Xác thực URL Webhook của kênh thanh toán
     */
    async confirmWebhook(webhookUrl: string): Promise<string> {
        try {
            this.logger.debug(`Confirming webhook URL: ${webhookUrl}`);

            const result = await this.payOS.confirmWebhook(webhookUrl);

            this.logger.log(
                `Webhook confirmed successfully for URL: ${webhookUrl}`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `Failed to confirm webhook URL: ${webhookUrl}`,
                error.stack,
            );
            throw new Error(`Failed to confirm webhook: ${error.message}`);
        }
    }

    /**
     * Xác minh dữ liệu nhận được qua webhook sau khi thanh toán
     */
    verifyPaymentWebhookData(webhookData: WebhookType): WebhookDataType {
        try {
            this.logger.debug(
                `Verifying webhook data for order: ${webhookData.data?.orderCode}`,
            );

            const result = this.payOS.verifyPaymentWebhookData(webhookData);

            this.logger.log(
                `Webhook data verified successfully for order: ${webhookData.data?.orderCode}`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `Failed to verify webhook data for order: ${webhookData.data?.orderCode}`,
                error.stack,
            );
            throw new Error(`Invalid webhook signature: ${error.message}`);
        }
    }

    /**
     * Kiểm tra trạng thái kết nối PayOS
     */
    async healthCheck(): Promise<{ status: string; timestamp: Date }> {
        try {
            // Có thể test bằng cách gọi một API đơn giản
            // Hiện tại chỉ return status based on initialization
            return {
                status: this.payOS ? 'connected' : 'disconnected',
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error('PayOS health check failed', error.stack);
            return {
                status: 'error',
                timestamp: new Date(),
            };
        }
    }

    /**
     * Generate random order code
     */
    generateOrderCode(): number {
        const orderCode = Math.floor(Math.random() * 1000000);
        this.logger.debug(`Generated order code: ${orderCode}`);
        return orderCode;
    }

    /**
     * Validate order code format
     */
    validateOrderCode(orderCode: string | number): number {
        const numericOrderCode =
            typeof orderCode === 'string' ? parseInt(orderCode) : orderCode;

        if (isNaN(numericOrderCode) || numericOrderCode <= 0) {
            throw new Error(`Invalid order code: ${orderCode}`);
        }

        return numericOrderCode;
    }
}
