import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppointmentStatusType } from 'src/enums';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UserPackageSubscriptionsService } from '../user-package-subscriptions/user-package-subscriptions.service';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentSubscriptionService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @Inject(forwardRef(() => UserPackageSubscriptionsService))
        private readonly userPackageSubscriptionsService: UserPackageSubscriptionsService,
    ) {}

    /**
     * Xử lý logic business sau khi thanh toán thành công
     */
    async processSuccessfulPayment(payment: Payment) {
        try {
            // 1. Nếu thanh toán cho gói dịch vụ
            if (payment.servicePackage) {
                await this.createUserPackageSubscription(payment);
            }

            // 2. Nếu thanh toán cho cuộc hẹn
            if (payment.appointment) {
                await this.updateAppointmentStatus(payment);
            }

            // 3. Log success
            console.log(
                `Successfully processed payment ${payment.id} business logic`,
            );
        } catch (error) {
            console.error('Lỗi xử lý business logic sau thanh toán:', error);
            // Log lỗi nhưng không throw để không ảnh hưởng đến việc cập nhật trạng thái thanh toán
        }
    }

    /**
     * Tạo subscription cho user khi thanh toán gói thành công
     */
    private async createUserPackageSubscription(payment: Payment) {
        if (!payment.servicePackage) return;

        try {
            const subscriptionData = {
                userId: payment.user.id,
                packageId: payment.servicePackage.id,
                paymentId: payment.id,
            };

            // Tạo subscription tự động
            const subscription =
                await this.userPackageSubscriptionsService.create(
                    subscriptionData,
                );
            console.log('Đã tạo subscription thành công:', subscription.id);
        } catch (error) {
            console.error('Lỗi tạo subscription:', error.message);
            // Không throw error để tránh ảnh hưởng đến flow thanh toán
        }
    }

    /**
     * Cập nhật trạng thái appointment khi thanh toán thành công
     */
    private async updateAppointmentStatus(payment: Payment) {
        if (!payment.appointment) return;

        try {
            if (payment.appointment.status === AppointmentStatusType.PENDING) {
                payment.appointment.status = AppointmentStatusType.CONFIRMED;
                await this.appointmentRepository.save(payment.appointment);
                console.log(
                    `Xác nhận appointment ${payment.appointment.id} sau thanh toán thành công`,
                );
            }
        } catch (error) {
            console.error('Lỗi cập nhật appointment status:', error.message);
        }
    }
}
