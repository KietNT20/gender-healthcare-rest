import { Injectable, Logger } from '@nestjs/common';
import {
    CheckoutRequestType,
    CheckoutResponseDataType,
    PaymentLinkDataType,
    WebhookDataType,
    WebhookType,
} from '@payos/node/lib/type';
// eslint-disable-next-line @typescript-eslint/no-require-imports
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
            throw new Error('Missing PayOS credentials');
        }

        this.payOS = new PayOS(clientId, apiKey, checksumKey);
        this.logger.log('PayOS service initialized successfully');
    }

    /**
     * Create payment link for order data
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
                error instanceof Error ? error.stack : String(error),
            );
            throw new Error(
                `Failed to create payment link: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Get payment information of order that has created payment link
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
                error instanceof Error ? error.stack : String(error),
            );
            throw new Error(
                `Failed to get payment information: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Cancel payment link of order
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
                error instanceof Error ? error.stack : String(error),
            );
            throw new Error(
                `Failed to cancel payment link: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Confirm webhook URL of payment channel
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
                error instanceof Error ? error.stack : String(error),
            );
            throw new Error(
                `Failed to confirm webhook: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Verify webhook data after payment
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
                error instanceof Error ? error.stack : String(error),
            );
            throw new Error(
                `Invalid webhook signature: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Check connection status of PayOS
     */
    healthCheck(): { status: string; timestamp: Date } {
        try {
            return {
                status: this.payOS ? 'connected' : 'disconnected',
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(
                'PayOS health check failed',
                error instanceof Error ? error.stack : String(error),
            );
            return {
                status: 'error',
                timestamp: new Date(),
            };
        }
    }

    /**
     * Generate random order code for order
     */
    generateOrderCode(): number {
        const orderCode = Math.floor(Math.random() * 1000000);
        this.logger.debug(`Generated order code: ${orderCode}`);
        return orderCode;
    }

    /**
     * Validate order code format for order
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
