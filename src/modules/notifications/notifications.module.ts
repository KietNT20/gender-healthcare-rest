import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from 'src/constant';
import { MailModule } from '../mail/mail.module';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, User]),
        BullModule.registerQueue({
            name: QUEUE_NAMES.NOTIFICATION_QUEUE,
        }),
        MailModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationProcessor],
    exports: [NotificationsService],
})
export class NotificationsModule {}
