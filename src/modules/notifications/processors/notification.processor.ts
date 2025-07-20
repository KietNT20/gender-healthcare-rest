import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from 'src/constant';
import {
    MenstrualCycleDetails,
    SendAppointmentCancellation,
    SendAppointmentConfirmation,
    SendAppointmentReminder,
    SendContraceptiveReminder,
    TestResultDetails,
} from 'src/modules/mail/interfaces';
import { MailService } from 'src/modules/mail/mail.service';
import { NotificationsService } from '../notifications.service';

/**
 * @enum NotificationType
 * @description Enum tập trung cho tất cả các loại thông báo trong hệ thống.
 */
export enum NotificationType {
    // Appointment Notifications
    APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
    APPOINTMENT_REQUEST = 'APPOINTMENT_REQUEST',
    APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
    APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
    APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
    APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
    MEETING_LINK_UPDATED = 'MEETING_LINK_UPDATED',
    PATIENT_CHECKED_IN = 'PATIENT_CHECKED_IN',
    PATIENT_LATE_ARRIVAL = 'PATIENT_LATE_ARRIVAL',
    APPOINTMENT_NO_SHOW = 'APPOINTMENT_NO_SHOW',
    APPOINTMENT_FEEDBACK_REQUEST = 'APPOINTMENT_FEEDBACK_REQUEST',

    // Menstrual Cycle Notifications
    OVULATION = 'ovulation',
    PERIOD_START = 'period_start',
    FERTILE_WINDOW = 'fertile_window',
    IRREGULAR_CYCLE_ALERT = 'irregular_cycle_alert',

    // Contraceptive Notifications
    CONTRACEPTIVE = 'contraceptive',

    // Test Result Notifications
    TEST_RESULT_READY = 'TEST_RESULT_READY',

    // Profile Notifications
    PROFILE_APPROVED = 'PROFILE_APPROVED',
    PROFILE_REJECTED = 'PROFILE_REJECTED',
}

/**
 * @interface NotificationJobData
 * @description Cấu trúc dữ liệu chuẩn cho một công việc thông báo.
 * - `context`: Chứa dữ liệu động để render các template email.
 */
export interface NotificationJobData {
    type: NotificationType;
    userId: string;
    email: string;
    title: string;
    content: string;
    actionUrl?: string;
    context?: Record<string, any>;
}

@Processor(QUEUE_NAMES.NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly mailService: MailService,
        private readonly notificationsService: NotificationsService,
    ) {
        super();
    }

    /**
     * @method process
     * @description Xử lý một job thông báo từ hàng đợi.
     * 1. Lưu thông báo in-app vào CSDL.
     * 2. Gửi email tương ứng.
     */
    async process(job: Job<NotificationJobData>): Promise<void> {
        this.logger.log(
            `Processing job '${job.name}' (ID: ${job.id}) for user ${job.data.userId}`,
        );
        const { data } = job;

        try {
            // Bước 1: Luôn lưu thông báo vào CSDL trước.
            await this.notificationsService.create({
                userId: data.userId,
                title: data.title,
                content: data.content,
                type: data.type,
                actionUrl: data.actionUrl,
            });
            this.logger.log(
                `Saved in-app notification to DB for job ${job.id}`,
            );

            // Bước 2: Gửi email.
            await this.sendEmailNotification(data);
            this.logger.log(`Email sent for job ${job.id}`);
        } catch (error) {
            this.logger.error(
                `Failed to process notification job ${job.id}:`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error; // Ném lỗi để BullMQ có thể retry job
        }
    }

    /**
     * @method sendEmailNotification
     * @description Helper để điều hướng và gửi email dựa trên loại thông báo.
     */
    private async sendEmailNotification(
        data: NotificationJobData,
    ): Promise<void> {
        if (!data.email || !data.context) {
            this.logger.warn(
                `Skipping email for job type ${data.type} to user ${data.userId} due to missing email or context.`,
            );
            return;
        }

        const { email, title, type, context } = data;

        // Dùng một hàm chung trong MailService hoặc các hàm riêng biệt
        try {
            switch (type) {
                case NotificationType.APPOINTMENT_CREATED:
                case NotificationType.APPOINTMENT_REQUEST:
                    await this.mailService.sendAppointmentConfirmation(
                        email,
                        context as SendAppointmentConfirmation,
                    );
                    break;

                case NotificationType.APPOINTMENT_REMINDER:
                    await this.mailService.sendAppointmentReminder(
                        email,
                        context as SendAppointmentReminder,
                    );
                    break;

                case NotificationType.APPOINTMENT_CANCELLED:
                    await this.mailService.sendAppointmentCancellation(
                        email,
                        context as SendAppointmentCancellation,
                    );
                    break;

                case NotificationType.APPOINTMENT_NO_SHOW:
                    await this.mailService.sendEmail(
                        email,
                        title,
                        'appointment-no-show',
                        context,
                    );
                    break;

                case NotificationType.CONTRACEPTIVE:
                    await this.mailService.sendContraceptiveReminder(
                        email,
                        context as SendContraceptiveReminder,
                    );
                    break;

                case NotificationType.OVULATION:
                case NotificationType.PERIOD_START:
                case NotificationType.FERTILE_WINDOW:
                    await this.mailService.sendMenstrualCycleReminder(email, {
                        ...context,
                        menstrualCycleType: type,
                    } as MenstrualCycleDetails);
                    break;

                case NotificationType.TEST_RESULT_READY:
                    await this.mailService.sendTestResultNotification(
                        email,
                        context as TestResultDetails,
                    );
                    break;

                case NotificationType.PROFILE_APPROVED:
                    await this.mailService.sendConsultantApprovalEmail(
                        email,
                        context.userName as string,
                    );
                    break;

                case NotificationType.PROFILE_REJECTED:
                    await this.mailService.sendConsultantRejectionEmail(
                        email,
                        context.userName as string,
                        context.reason as string,
                    );
                    break;

                case NotificationType.IRREGULAR_CYCLE_ALERT:
                    // Chỉ gửi in-app notification
                    this.logger.log(
                        `In-app only notification for irregular cycle alert to user ${data.userId}`,
                    );
                    break;

                // Các trường hợp khác có thể dùng template chung hoặc không gửi email
                case NotificationType.APPOINTMENT_CONFIRMED:
                case NotificationType.APPOINTMENT_UPDATED:
                case NotificationType.MEETING_LINK_UPDATED:
                case NotificationType.PATIENT_CHECKED_IN:
                case NotificationType.PATIENT_LATE_ARRIVAL:
                case NotificationType.APPOINTMENT_FEEDBACK_REQUEST:
                    // Hiện tại chỉ có thông báo in-app, có thể thêm email sau
                    this.logger.log(
                        `In-app only notification for type: ${type}`,
                    );
                    break;

                default:
                    this.logger.warn(
                        `No email handler for notification type: ${type as NotificationType}`,
                    );
            }
        } catch (error) {
            this.logger.error(
                `Error sending email for type ${type} to ${email}:`,
                error,
            );
            throw error;
        }
    }
}
