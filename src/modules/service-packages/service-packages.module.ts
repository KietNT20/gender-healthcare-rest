import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicePackagesService } from './service-packages.service';
import { ServicePackagesController } from './service-packages.controller';
import { ServicePackage } from './entities/service-package.entity';
import { PackageService } from '../package-services/entities/package-service.entity';
import { UserPackageSubscription } from '../user-package-subscriptions/entities/user-package-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServicePackage, PackageService, UserPackageSubscription])],
  controllers: [ServicePackagesController],
  providers: [ServicePackagesService],
  exports: [ServicePackagesService],
})
export class ServicePackagesModule {}