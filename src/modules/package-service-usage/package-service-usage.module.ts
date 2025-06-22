import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageServiceUsageService } from './package-service-usage.service';
import { PackageServiceUsageController } from './package-service-usage.controller';
import { PackageServiceUsage } from './entities/package-service-usage.entity';
import { ServicePackagesModule } from '../service-packages/service-packages.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PackageServiceUsage]),
    ServicePackagesModule, // Cung cấp UserPackageSubscriptionRepository
    ServicesModule, // Cung cấp ServiceRepository
  ],
  controllers: [PackageServiceUsageController],
  providers: [PackageServiceUsageService],
  exports: [PackageServiceUsageService],
})
export class PackageServiceUsageModule {}