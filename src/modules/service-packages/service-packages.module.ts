import { Module } from '@nestjs/common';
import { ServicePackagesService } from './service-packages.service';
import { ServicePackagesController } from './service-packages.controller';

@Module({
    controllers: [ServicePackagesController],
    providers: [ServicePackagesService],
})
export class ServicePackagesModule {}
