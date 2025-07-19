import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from 'src/constant';
import { CreateNotificationDto } from 'src/modules/notifications/dto/create-notification.dto';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@Processor(QUEUE_NAMES.BLOG_NOTIFICATION)
@Injectable()
export class BlogNotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(BlogNotificationProcessor.name);

    constructor(private readonly notificationsService: NotificationsService) {
        super();
    }

    async process(job: Job<any, any, string>) {
        switch (job.name) {
            case 'send-blog-notification':
                await this.handleSendNotification(job);
                break;
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }

    private async handleSendNotification(job: Job) {
        const { notificationData } = job.data as {
            notificationData: CreateNotificationDto;
        };
        try {
            await this.notificationsService.create(notificationData);
            this.logger.log(
                `Created blog notification for user ${notificationData.userId}`,
            );
        } catch (err) {
            this.logger.error(
                `Failed to create blog notification for user ${notificationData.userId}`,
                err,
            );
            throw err;
        }
    }
}
