import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from 'src/modules/mail/mail.service';
import { NotificationsService } from '../notifications.service';

export interface NotificationJobData {
    userId: string;
    type: 'ovulation' | 'period_start' | 'fertile_window' | 'contraceptive';
    title: string;
    content: string;
    email: string;
    userName: string;
    predictedDate?: string;
    contraceptiveType?: string;
}

@Processor('notification-queue')
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly mailService: MailService,
        private readonly notificationsService: NotificationsService,
    ) {
        super();
    }

    async process(job: Job<NotificationJobData>): Promise<void> {
        this.logger.log(
            `Processing notification job ${job.id} for user ${job.data.userId}`,
        );
        const { data } = job;

        try {
            // 1. Lưu thông báo vào database
            await this.notificationsService.create({
                userId: data.userId,
                title: data.title,
                content: data.content,
                type: data.type,
            });

            // 2. Gửi email
            if (data.type === 'contraceptive' && data.contraceptiveType) {
                await this.mailService.sendContraceptiveReminder(data.email, {
                    userName: data.userName,
                    contraceptiveType: data.contraceptiveType,
                    reminderMessage: data.content,
                });
            } else if (data.predictedDate) {
                await this.mailService.sendMenstrualCycleReminder(data.email, {
                    userName: data.userName,
                    cycleType: data.type as
                        | 'ovulation'
                        | 'period_start'
                        | 'fertile_window',
                    predictedDate: data.predictedDate,
                });
            }

            this.logger.log(`Notification job ${job.id} completed.`);
        } catch (error) {
            this.logger.error(
                `Failed to process notification job ${job.id}`,
                error.stack,
            );
            throw error;
        }
    }
}
