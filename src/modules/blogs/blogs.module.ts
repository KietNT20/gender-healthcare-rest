import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { Category } from '../categories/entities/category.entity';
import { TagsModule } from '../tags/tags.module';

@Module({
    imports: [TypeOrmModule.forFeature([Blog, Category]), TagsModule],
    controllers: [BlogsController],
    providers: [BlogsService],
})
export class BlogsModule {}
