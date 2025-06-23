import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { Category } from '../categories/entities/category.entity';
import { TagsModule } from '../tags/tags.module';
import { BlogImageService } from './blogs-image.service';
import { Image } from '../images/entities/image.entity';
import { ImagesModule } from '../images/images.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Blog, Category, Image]),
        ImagesModule,
        TagsModule,
    ],
    controllers: [BlogsController],
    providers: [BlogsService, BlogImageService],
    exports: [BlogsService, BlogImageService],
})
export class BlogsModule {}
