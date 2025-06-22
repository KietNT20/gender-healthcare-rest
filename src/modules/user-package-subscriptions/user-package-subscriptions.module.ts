import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageServiceUsage } from '../package-service-usage/entities/package-service-usage.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentsModule } from '../payments/payments.module'; // Import PaymentsModule
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { User } from '../users/entities/user.entity';
import { UserPackageSubscription } from './entities/user-package-subscription.entity';
import { UserPackageSubscriptionsController } from './user-package-subscriptions.controller';
import { UserPackageSubscriptionsService } from './user-package-subscriptions.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserPackageSubscription,
            User,
            ServicePackage,
            Payment,
            PackageServiceUsage,
        ]),
        forwardRef(() => PaymentsModule), // Sử dụng forwardRef để tránh circular dependency
    ],
    controllers: [UserPackageSubscriptionsController],
    providers: [UserPackageSubscriptionsService],
    exports: [UserPackageSubscriptionsService],
})
export class UserPackageSubscriptionsModule {}
