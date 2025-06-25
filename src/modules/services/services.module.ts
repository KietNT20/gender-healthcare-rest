import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { Category } from '../categories/entities/category.entity';
import { Image } from '../images/entities/image.entity';
import { ImagesModule } from '../images/images.module';
import { Service } from './entities/service.entity';
import { ServiceImageService } from './service-image.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Service, Category, Image]),
        CategoriesModule,
        ImagesModule,
    ],
    controllers: [ServicesController],
    providers: [ServicesService, ServiceImageService],
    exports: [ServicesService],
})
export class ServicesModule {}
