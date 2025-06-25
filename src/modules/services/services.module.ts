import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Service } from './entities/service.entity';
import { Category } from '../categories/entities/category.entity';
import { Image } from '../images/entities/image.entity';
import { CategoriesModule } from '../categories/categories.module';
import { ImagesModule } from '../images/images.module';
import { ServiceImageService } from './service-image.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Service, Category, Image]),
        CategoriesModule,
        ImagesModule,
    ],
    controllers: [ServicesController],
    providers: [ServicesService, ServiceImageService],
    exports: [ServicesService, ServiceImageService, TypeOrmModule.forFeature([Service])],
})
export class ServicesModule {}