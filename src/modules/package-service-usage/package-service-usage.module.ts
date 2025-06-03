import { Module } from '@nestjs/common';
import { PackageServiceUsageService } from './package-service-usage.service';
import { PackageServiceUsageController } from './package-service-usage.controller';

@Module({
  controllers: [PackageServiceUsageController],
  providers: [PackageServiceUsageService],
})
export class PackageServiceUsageModule {}
