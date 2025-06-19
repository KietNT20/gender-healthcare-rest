import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPackageSubscriptionsService } from './user-package-subscriptions.service';
import { UserPackageSubscriptionsController } from './user-package-subscriptions.controller';
import { UserPackageSubscription } from './entities/user-package-subscription.entity';
import { User } from '../users/entities/user.entity';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PackageServiceUsage } from '../package-service-usage/entities/package-service-usage.entity';
import { PaymentsModule } from '../payments/payments.module'; // Import PaymentsModule

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPackageSubscription, User, ServicePackage, Payment, PackageServiceUsage]),
    PaymentsModule, // Thêm PaymentsModule vào imports
  ],
  controllers: [UserPackageSubscriptionsController],
  providers: [UserPackageSubscriptionsService],
  exports: [UserPackageSubscriptionsService],
})
export class UserPackageSubscriptionsModule {}