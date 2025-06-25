import { Injectable } from '@nestjs/common';
import { PaymentStatusType } from 'src/enums';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { CreateAppointmentPaymentDto } from './dto/create-appointment-payment.dto';
import { CreatePackagePaymentDto } from './dto/create-package-payment.dto';
import { CreateServicePaymentDto } from './dto/create-service-payment.dto';
import { WebhookTypeDTO } from './dto/webhook-type.dto';
import { PaymentCallbackService } from './providers/payment-callback.service';
import { PaymentLinkService } from './providers/payment-link.service';
import { PaymentRepositoryService } from './providers/payment-repository.service';
import { UserPaymentService } from './providers/user-payment.service';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly paymentLinkService: PaymentLinkService,
        private readonly paymentCallbackService: PaymentCallbackService,
        private readonly paymentRepositoryService: PaymentRepositoryService,
        private readonly userPaymentService: UserPaymentService,
    ) {}

    /**
     * Tạo thanh toán cho gói dịch vụ
     */
    async createPackagePayment(
        createDto: CreatePackagePaymentDto,
        userId: string,
    ) {
        return this.paymentLinkService.createPackagePayment(createDto, userId);
    }

    /**
     * Tạo thanh toán cho cuộc hẹn
     */
    async createAppointmentPayment(
        createDto: CreateAppointmentPaymentDto,
        userId: string,
    ) {
        return this.paymentLinkService.createAppointmentPayment(
            createDto,
            userId,
        );
    }

    /**
     * Tạo thanh toán cho dịch vụ
     */
    async createServicePayment(
        createDto: CreateServicePaymentDto,
        userId: string,
    ) {
        return this.paymentLinkService.createServicePayment(createDto, userId);
    }

    /**
     * Xử lý success callback từ PayOS
     */
    async handleSuccessCallback(orderCode: string) {
        const defaultFrontendDomain =
            this.paymentLinkService.getDefaultFrontendDomain();

        return this.paymentCallbackService.handleSuccessCallback(
            orderCode,
            defaultFrontendDomain,
        );
    }

    /**
     * Xử lý cancel callback từ PayOS
     */
    async handleCancelCallback(orderCode: string) {
        const defaultFrontendDomain =
            this.paymentLinkService.getDefaultFrontendDomain();

        return this.paymentCallbackService.handleCancelCallback(
            orderCode,
            defaultFrontendDomain,
        );
    }

    /**
     * Xác thực và xử lý webhook từ PayOS
     */
    async verifyWebhook(webhookData: WebhookTypeDTO) {
        return this.paymentCallbackService.verifyWebhook(webhookData);
    }

    /**
     * Lấy tất cả payments (admin use)
     */
    async findAll() {
        return this.paymentRepositoryService.findAllPayments();
    }

    /**
     * Tìm payment theo ID
     */
    async findOne(id: string) {
        return this.paymentRepositoryService.findPaymentById(id);
    }

    /**
     * Tìm payment theo invoice number
     */
    async findOneByInvoiceNumber(invoiceNumber: string) {
        return this.paymentRepositoryService.findPaymentByInvoiceNumber(
            invoiceNumber,
        );
    }

    /**
     * Soft delete payment
     */
    async remove(id: string) {
        return this.paymentRepositoryService.softDeletePayment(id);
    }

    /**
     * Hủy thanh toán (admin use)
     */
    async cancelPayment(id: string, cancelDto: CancelPaymentDto) {
        return this.paymentCallbackService.cancelPayment(id, cancelDto);
    }

    /**
     * Lấy danh sách payments của user
     */
    async getUserPayments(userId: string, status?: PaymentStatusType) {
        return this.userPaymentService.getUserPayments(userId, status);
    }

    /**
     * Lấy payment với check ownership
     */
    async findPaymentByIdAndUser(paymentId: string, userId: string) {
        return this.userPaymentService.findPaymentByIdAndUser(
            paymentId,
            userId,
        );
    }

    /**
     * Thống kê thanh toán của user
     */
    async getUserPaymentStats(userId: string) {
        return this.userPaymentService.getUserPaymentStats(userId);
    }

    /**
     * Lấy danh sách cuộc hẹn chờ thanh toán
     */
    async getPendingAppointments(userId: string) {
        return this.userPaymentService.getPendingAppointments(userId);
    }

    /**
     * Cancel payment với check ownership
     */
    async cancelPaymentByUser(
        paymentId: string,
        userId: string,
        cancelDto: CancelPaymentDto,
    ) {
        return this.userPaymentService.cancelPaymentByUser(
            paymentId,
            userId,
            cancelDto,
        );
    }

    /**
     * Lấy chi tiết payment của user
     */
    async getUserPaymentDetails(paymentId: string, userId: string) {
        return this.userPaymentService.getUserPaymentDetails(paymentId, userId);
    }

    /**
     * Kiểm tra trạng thái thanh toán của user
     */
    async checkUserPaymentStatus(paymentId: string, userId: string) {
        return this.userPaymentService.checkUserPaymentStatus(
            paymentId,
            userId,
        );
    }
}
