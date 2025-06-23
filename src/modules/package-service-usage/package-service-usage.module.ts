import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicePackagesModule } from '../service-packages/service-packages.module';
import { Service } from '../services/entities/service.entity';
import { ServicesModule } from '../services/services.module';
import { UserPackageSubscription } from '../user-package-subscriptions/entities/user-package-subscription.entity';
import { PackageServiceUsage } from './entities/package-service-usage.entity';
import { PackageServiceUsageController } from './package-service-usage.controller';
import { PackageServiceUsageService } from './package-service-usage.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PackageServiceUsage,
            UserPackageSubscription,
            Service,
        ]),
        ServicePackagesModule,
        ServicesModule,
    ],
    controllers: [PackageServiceUsageController],
    providers: [PackageServiceUsageService],
    exports: [PackageServiceUsageService],
})
export class PackageServiceUsageModule {}
