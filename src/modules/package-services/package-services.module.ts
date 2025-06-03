import { Module } from '@nestjs/common';
import { PackageServicesService } from './package-services.service';
import { PackageServicesController } from './package-services.controller';

@Module({
  controllers: [PackageServicesController],
  providers: [PackageServicesService],
})
export class PackageServicesModule {}
