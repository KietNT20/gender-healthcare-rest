import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageServiceUsageService } from './package-service-usage.service';
import { PackageServiceUsageController } from './package-service-usage.controller';
import { PackageServiceUsage } from './entities/package-service-usage.entity';
import { UserPackageSubscription } from '../user-package-subscriptions/entities/user-package-subscription.entity';
import { Service } from '../services/entities/service.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PackageServiceUsage, UserPackageSubscription, Service, Appointment])],
  controllers: [PackageServiceUsageController],
  providers: [PackageServiceUsageService],
  exports: [PackageServiceUsageService],
})
export class PackageServiceUsageModule {}