import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { UserPackageSubscription } from '../user-package-subscriptions/entities/user-package-subscription.entity';
import { ServicePackageStatsService } from './service-package-stats.service';
import { ServicePackageStatsController } from './service-package-stats.controller';

/**
 * Module for handling service package statistics and reports
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([ServicePackage, UserPackageSubscription]),
    ],
    controllers: [ServicePackageStatsController],
    providers: [ServicePackageStatsService],
    exports: [ServicePackageStatsService],
})
export class ServicePackageStatsModule {}
