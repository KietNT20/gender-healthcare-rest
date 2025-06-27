import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { Image } from '../images/entities/image.entity';
import { ImagesModule } from '../images/images.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TagsModule } from '../tags/tags.module';
import { User } from '../users/entities/user.entity';
import { BlogAdminNotificationService } from './blog-admin-notification.service';
import { BlogNotificationService } from './blog-notification.service';
import { BlogImageService } from './blogs-image.service';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { Blog } from './entities/blog.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Blog, Category, Image, User]),
        ImagesModule,
        TagsModule,
        NotificationsModule,
    ],
    controllers: [BlogsController],
    providers: [
        BlogsService,
        BlogImageService,
        BlogNotificationService,
        BlogAdminNotificationService,
    ],
    exports: [
        BlogsService,
        BlogImageService,
        BlogNotificationService,
        BlogAdminNotificationService,
    ],
})
export class BlogsModule {}