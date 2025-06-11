import { Module } from '@nestjs/common';
import { UserPackageSubscriptionsService } from './user-package-subscriptions.service';
import { UserPackageSubscriptionsController } from './user-package-subscriptions.controller';

@Module({
  controllers: [UserPackageSubscriptionsController],
  providers: [UserPackageSubscriptionsService],
})
export class UserPackageSubscriptionsModule {}
