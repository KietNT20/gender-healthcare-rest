import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { UserPackageSubscription } from '../user-package-subscriptions/entities/user-package-subscription.entity';
import { ServicePackagesStatsController } from './service-packages-stats.controller';
import { ServicePackagesStatsService } from './service-packages-stats.service';

/**
 * Module for handling service package statistics and reports
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([ServicePackage, UserPackageSubscription]),
    ],
    controllers: [ServicePackagesStatsController],
    providers: [ServicePackagesStatsService],
    exports: [ServicePackagesStatsService],
})
export class ServicePackagesStatsModule {}
