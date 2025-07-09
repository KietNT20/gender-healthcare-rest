import { Injectable } from '@nestjs/common';
import { PaymentStatusType } from 'src/enums';
import { CancelPaymentDto } from '../dto/cancel-payment.dto';
import { PaymentCallbackService } from './payment-callback.service';
import { PaymentRepositoryService } from './payment-repository.service';
import { PaymentValidationService } from './payment-validation.service';

@Injectable()
export class UserPaymentService {
    constructor(
        private readonly paymentRepositoryService: PaymentRepositoryService,
        private readonly paymentValidationService: PaymentValidationService,
        private readonly paymentCallbackService: PaymentCallbackService,
    ) {}

    /**
     * Lấy danh sách payments của user với filter status
     */
    async getUserPayments(userId: string, status?: PaymentStatusType) {
        await this.paymentValidationService.validateUser(userId);

        const payments = await this.paymentRepositoryService.getUserPayments(
            userId,
            status,
        );

        return {
            success: true,
            data: payments,
            message: 'Lấy danh sách thanh toán thành công',
        };
    }

    /**
     * Lấy payment với check ownership
     */
    async findPaymentByIdAndUser(paymentId: string, userId: string) {
        await this.paymentValidationService.validateUser(userId);
        return this.paymentRepositoryService.findPaymentByIdAndUser(
            paymentId,
            userId,
        );
    }

    /**
     * Thống kê thanh toán của user
     */
    async getUserPaymentStats(userId: string) {
        await this.paymentValidationService.validateUser(userId);
        return this.paymentRepositoryService.getUserPaymentStats(userId);
    }

    /**
     * Lấy danh sách cuộc hẹn chờ thanh toán của user
     */
    async getPendingAppointments(userId: string) {
        await this.paymentValidationService.validateUser(userId);
        return this.paymentRepositoryService.getPendingAppointments(userId);
    }

    /**
     * Cancel payment với check ownership
     */
    async cancelPaymentByUser(
        paymentId: string,
        userId: string,
        cancelDto: CancelPaymentDto,
    ) {
        await this.paymentValidationService.validateUser(userId);

        // Tìm payment và check ownership
        const payment =
            await this.paymentRepositoryService.findPaymentByIdAndUser(
                paymentId,
                userId,
            );

        // Delegate to callback service để cancel
        return this.paymentCallbackService.cancelPaymentFromSystem(
            payment.id,
            cancelDto,
        );
    }

    /**
     * Lấy chi tiết payment của user
     */
    async getUserPaymentDetails(paymentId: string, userId: string) {
        await this.paymentValidationService.validateUser(userId);

        const payment =
            await this.paymentRepositoryService.findPaymentByIdAndUser(
                paymentId,
                userId,
            );

        return {
            success: true,
            data: payment,
            message: 'Lấy chi tiết thanh toán thành công',
        };
    }

    /**
     * Kiểm tra trạng thái thanh toán của user
     */
    async checkUserPaymentStatus(paymentId: string, userId: string) {
        await this.paymentValidationService.validateUser(userId);

        const payment =
            await this.paymentRepositoryService.findPaymentByIdAndUser(
                paymentId,
                userId,
            );

        return {
            success: true,
            data: {
                id: payment.id,
                status: payment.status,
                amount: payment.amount,
                paymentDate: payment.paymentDate,
                invoiceNumber: payment.invoiceNumber,
                canCancel: payment.status === PaymentStatusType.PENDING,
            },
            message: 'Kiểm tra trạng thái thanh toán thành công',
        };
    }
}
