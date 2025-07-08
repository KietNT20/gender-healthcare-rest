import {
    CheckoutResponseDataType,
    PaymentLinkDataType,
    WebhookDataType,
} from '@payos/node/lib/type';
import { PayOSPaymentStatus } from '../enums/payos.enum';

export type GatewayResponseType = Partial<CheckoutResponseDataType> & {
    frontendReturnUrl: string;
    frontendCancelUrl: string;
    payosStatus?: PayOSPaymentStatus;
    paymentConfirmedAt?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    cancelledBy?: 'USER' | 'SYSTEM' | 'WEBHOOK';
    paymentInfo?: PaymentLinkDataType;
    webhookData?: WebhookDataType;
    payosCancelResult?: PaymentLinkDataType | null;
};
