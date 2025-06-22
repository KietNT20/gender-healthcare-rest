import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicePackage } from './entities/service-package.entity';
import { ServicePackagesController } from './service-packages.controller';
import { ServicePackagesService } from './service-packages.service';

@Module({
    imports: [TypeOrmModule.forFeature([ServicePackage])],
    controllers: [ServicePackagesController],
    providers: [ServicePackagesService],
    exports: [ServicePackagesService],
})
export class ServicePackagesModule {}
