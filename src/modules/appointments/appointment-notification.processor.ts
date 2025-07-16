import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from 'src/constant';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { MailService } from '../mail/mail.service';

@Processor(QUEUE_NAMES.APPOINTMENT_NOTIFICATION)
@Injectable()
export class AppointmentNotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(AppointmentNotificationProcessor.name);

    constructor(
        private readonly mailService: MailService,
        private readonly notificationsService: NotificationsService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>) {
        switch (job.name) {
            case 'send-confirmation-email':
                await this.handleSendConfirmationEmail(job);
                break;
            case 'send-appointment-notification':
                await this.handleSendNotification(job);
                break;
            // Thêm các case khác nếu cần
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }

    private async handleSendConfirmationEmail(job: Job) {
        const { email, data } = job.data;
        try {
            await this.mailService.sendAppointmentConfirmation(email, data);
            this.logger.log(`Sent confirmation email to ${email}`);
        } catch (err) {
            this.logger.error(
                `Failed to send confirmation email to ${email}`,
                err,
            );
            throw err;
        }
    }

    private async handleSendNotification(job: Job) {
        const { notificationData } = job.data;
        try {
            await this.notificationsService.create(notificationData);
            this.logger.log(
                `Created notification for user ${notificationData.userId}`,
            );
        } catch (err) {
            this.logger.error(
                `Failed to create notification for user ${notificationData.userId}`,
                err,
            );
            throw err;
        }
    }
}
