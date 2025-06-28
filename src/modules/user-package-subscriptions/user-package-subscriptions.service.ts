import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PaymentStatusType, SubscriptionStatusType } from 'src/enums';
import { IsNull, Repository } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { User } from '../users/entities/user.entity';
import { CreateUserPackageSubscriptionDto } from './dto/create-user-package-subscription.dto';
import { UpdateUserPackageSubscriptionDto } from './dto/update-user-package-subscription.dto';
import { UserPackageSubscription } from './entities/user-package-subscription.entity';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class UserPackageSubscriptionsService {
    @WebSocketServer()
    server: Server;

    constructor(
        @InjectRepository(UserPackageSubscription)
        private subscriptionRepository: Repository<UserPackageSubscription>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(ServicePackage)
        private packageRepository: Repository<ServicePackage>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
    ) {}

    async create(createDto: CreateUserPackageSubscriptionDto) {
        const { userId, packageId, paymentId } = createDto;

        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: IsNull() },
        });
        if (!user)
            throw new NotFoundException(
                `Người dùng với ID '${userId}' không tìm thấy`,
            );

        const packageEntity = await this.packageRepository.findOne({
            where: { id: packageId, deletedAt: IsNull(), isActive: true },
        });
        if (!packageEntity) {
            throw new NotFoundException(
                `Gói dịch vụ với ID '${packageId}' không tìm thấy hoặc không hoạt động`,
            );
        }

        const payment = await this.paymentRepository.findOne({
            where: {
                id: paymentId,
                deletedAt: IsNull(),
                status: PaymentStatusType.COMPLETED,
            },
        });
        if (!payment) {
            throw new NotFoundException(
                `Thanh toán với ID '${paymentId}' không tìm thấy hoặc chưa hoàn tất`,
            );
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + packageEntity.durationMonths);

        const subscription = this.subscriptionRepository.create({
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
        await this.updateExpiredSubscriptions();
        return this.subscriptionRepository.find({
            where: { deletedAt: IsNull() },
            relations: ['user', 'package', 'payment'],
        });
    }

    async findOne(id: string) {
        await this.updateExpiredSubscriptions();
        const subscription = await this.subscriptionRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['user', 'package', 'payment'],
        });
        if (!subscription)
            throw new NotFoundException(
                `Đăng ký với ID '${id}' không tìm thấy`,
            );
        return subscription;
    }

    async update(id: string, updateDto: UpdateUserPackageSubscriptionDto) {
        const subscription = await this.findOne(id);
        if (
            subscription.status === SubscriptionStatusType.EXPIRED ||
            subscription.status === SubscriptionStatusType.CANCELLED
        ) {
            throw new BadRequestException(
                `Không thể cập nhật đăng ký đã hết hạn hoặc bị hủy`,
            );
        }
        this.subscriptionRepository.merge(subscription, updateDto);
        return await this.subscriptionRepository.save(subscription);
    }

    async remove(id: string) {
        const subscription = await this.findOne(id);
        if (subscription.status === SubscriptionStatusType.ACTIVE) {
            throw new BadRequestException(
                `Không thể xóa đăng ký đang hoạt động`,
            );
        }
        await this.subscriptionRepository.softDelete(id);
    }

    async checkSubscriptionStatus(userId: string) {
        await this.updateExpiredSubscriptions();
        const subscriptions = await this.subscriptionRepository.find({
            where: { user: { id: userId }, deletedAt: IsNull() },
            relations: {
                package: true,
            },
        });
        return subscriptions.map((sub) => ({
            id: sub.id,
            status: sub.status,
            endDate: sub.endDate,
            packageName: sub.package.name,
        }));
    }

    async updateExpiredSubscriptions() {
        try {
            const subscriptions = await this.subscriptionRepository.find({
                where: {
                    status: SubscriptionStatusType.ACTIVE,
                    deletedAt: IsNull(),
                },
                relations: {
                    user: true,
                    package: true,
                    payment: true,
                },
            });

            const now = new Date();
            for (const sub of subscriptions) {
                try {
                    if (
                        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
                            sub.id,
                        )
                    ) {
                        continue;
                    }

                    if (new Date(sub.endDate) < now) {
                        sub.status = SubscriptionStatusType.EXPIRED;
                        await this.subscriptionRepository.save(sub);
                        this.server.emit(`subscriptionUpdate_${sub.user.id}`, {
                            subscriptionId: sub.id,
                            status: sub.status,
                            packageName: sub.package.name,
                            message: `Gói ${sub.package.name} của bạn đã hết hạn vào ngày ${sub.endDate.toISOString()}.`,
                        });
                    }
                } catch (error) {
                    // Lỗi riêng lẻ cho từng đăng ký sẽ bị bỏ qua
                }
            }
        } catch (error) {
            throw new BadRequestException(
                'Lỗi khi cập nhật trạng thái đăng ký',
            );
        }
    }

    @Cron('0 0 * * *')
    async handleCron() {
        await this.updateExpiredSubscriptions();
        console.log('Đã kiểm tra và cập nhật trạng thái đăng ký hết hạn');
    }
}
