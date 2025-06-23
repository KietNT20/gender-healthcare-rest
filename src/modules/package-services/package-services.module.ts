import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageServicesService } from './package-services.service';
import { PackageServicesController } from './package-services.controller';
import { PackageService } from './entities/package-service.entity';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { Service } from '../services/entities/service.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PackageService, ServicePackage, Service]),
    ],
    controllers: [PackageServicesController],
    providers: [PackageServicesService],
    exports: [PackageServicesService],
})
export class PackageServicesModule {}
