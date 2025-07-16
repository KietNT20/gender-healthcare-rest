import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('sti-test-process-notification')
@Injectable()
export class StiTestProcessNotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(
        StiTestProcessNotificationProcessor.name,
    );

    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>) {
        switch (job.name) {
            case 'send-sti-notification':
                await this.handleSendNotification(job);
                break;
            case 'send-sti-result-email':
                await this.handleSendResultEmail(job);
                break;
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }

    private async handleSendNotification(job: Job) {
        const { notificationData } = job.data;
        try {
            await this.notificationsService.create(notificationData);
            this.logger.log(
                `Created STI notification for user ${notificationData.userId}`,
            );
        } catch (err) {
            this.logger.error(
                `Failed to create STI notification for user ${notificationData.userId}`,
                err,
            );
            throw err;
        }
    }

    private async handleSendResultEmail(job: Job) {
        const { email, data } = job.data;
        try {
            await this.mailService.sendTestResultNotification(email, data);
            this.logger.log(`Sent STI result email to ${email}`);
        } catch (err) {
            this.logger.error(
                `Failed to send STI result email to ${email}`,
                err,
            );
            throw err;
        }
    }
}
