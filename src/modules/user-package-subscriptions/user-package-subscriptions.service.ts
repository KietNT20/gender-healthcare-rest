import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserPackageSubscriptionDto } from './dto/create-user-package-subscription.dto';
import { UpdateUserPackageSubscriptionDto } from './dto/update-user-package-subscription.dto';
import { UserPackageSubscription } from './entities/user-package-subscription.entity';
import { User } from '../users/entities/user.entity';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatusType, SubscriptionStatusType } from 'src/enums';
import { IsNull } from 'typeorm';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class UserPackageSubscriptionsService {
    constructor(
        @InjectRepository(UserPackageSubscription)
        private subscriptionRepository: Repository<UserPackageSubscription>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(ServicePackage)
        private packageRepository: Repository<ServicePackage>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        private paymentsService: PaymentsService,
    ) {}

    async create(createDto: CreateUserPackageSubscriptionDto) {
        const { userId, packageId, paymentId, ...subscriptionData } = createDto;

        // Kiểm tra người dùng
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: IsNull() },
        });
        if (!user) {
            throw new NotFoundException(`User with ID '${userId}' not found`);
        }

        // Kiểm tra gói dịch vụ
        const packageEntity = await this.packageRepository.findOne({
            where: { id: packageId, deletedAt: IsNull(), isActive: true },
        });
        if (!packageEntity) {
            throw new NotFoundException(
                `Service package with ID '${packageId}' not found or inactive`,
            );
        }

        // Kiểm tra thanh toán
        const payment = await this.paymentRepository.findOne({
            where: {
                id: paymentId,
                deletedAt: IsNull(),
                status: PaymentStatusType.COMPLETED,
            },
        });
        if (!payment) {
            throw new NotFoundException(
                `Payment with ID '${paymentId}' not found or not completed`,
            );
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + packageEntity.durationMonths);

        const subscription = this.subscriptionRepository.create({
            ...subscriptionData,
            startDate,
            endDate,
            status: SubscriptionStatusType.ACTIVE,
            user: { id: userId },
            package: { id: packageId },
            payment: { id: paymentId },
        });

        return await this.subscriptionRepository.save(subscription);
    }

    async findAll() {
        return this.subscriptionRepository.find({
            where: { deletedAt: IsNull() },
            relations: ['user', 'package', 'payment'],
        });
    }

    async findOne(id: string) {
        const subscription = await this.subscriptionRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['user', 'package', 'payment'],
        });
        if (!subscription) {
            throw new NotFoundException(
                `Subscription with ID '${id}' not found`,
            );
        }
        return subscription;
    }

    async update(id: string, updateDto: UpdateUserPackageSubscriptionDto) {
        const subscription = await this.findOne(id);

        // Kiểm tra trạng thái trước khi cập nhật
        if (
            subscription.status === SubscriptionStatusType.EXPIRED ||
            subscription.status === SubscriptionStatusType.CANCELLED
        ) {
            throw new BadRequestException(
                `Cannot update expired or cancelled subscription`,
            );
        }

        // Sử dụng repository.merge để gộp các thay đổi từ DTO vào entity
        this.subscriptionRepository.merge(subscription, updateDto);

        return await this.subscriptionRepository.save(subscription);
    }

    async remove(id: string) {
        const subscription = await this.findOne(id);
        if (subscription.status === SubscriptionStatusType.ACTIVE) {
            throw new BadRequestException(`Cannot delete active subscription`);
        }
        await this.subscriptionRepository.softDelete(id);
    }

    // Phương thức bổ sung: Kiểm tra trạng thái gói
    async checkSubscriptionStatus(userId: string) {
        const subscriptions = await this.subscriptionRepository.find({
            where: { user: { id: userId }, deletedAt: IsNull() },
        });
        return subscriptions.map((sub) => ({
            id: sub.id,
            status: sub.status,
            endDate: sub.endDate,
        }));
    }
}
