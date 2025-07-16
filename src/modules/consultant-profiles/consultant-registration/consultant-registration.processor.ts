import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from 'src/constant';
import { MailService } from 'src/modules/mail/mail.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@Processor(QUEUE_NAMES.CONSULTANT_REGISTRATION_NOTIFICATION)
@Injectable()
export class ConsultantRegistrationNotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(
        ConsultantRegistrationNotificationProcessor.name,
    );

    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>) {
        switch (job.name) {
            case 'send-new-profile-pending':
                await this.handleSendNewProfilePending(job);
                break;
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }

    private async handleSendNewProfilePending(job: Job) {
        const { notificationData, emailData } = job.data;
        try {
            await this.notificationsService.create(notificationData);
            await this.mailService.sendNewProfilePendingReviewEmail(
                emailData.to,
                emailData.adminName,
                emailData.consultantName,
                emailData.reviewUrl,
            );
            this.logger.log(
                `Sent new profile notification and email to ${emailData.to}`,
            );
        } catch (err) {
            this.logger.error(
                `Failed to send new profile notification/email to ${emailData.to}`,
                err,
            );
            throw err;
        }
    }
}
