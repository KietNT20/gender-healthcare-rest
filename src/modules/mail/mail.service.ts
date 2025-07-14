import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) {}

    async sendEmailVerification(
        email: string,
        token: string,
        userName: string,
    ): Promise<void> {
        // Sử dụng backend URL để xử lý redirect
        const url = `${this.configService.get<string>('APP_URL')}/auth/verify-email?token=${token}`;

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Xác thực email của bạn',
                template: './email-verification',
                context: {
                    userName,
                    url,
                    appName: 'Dịch vụ Y tế Giới tính',
                },
            });

            this.logger.log(`Email verification sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send email verification to ${email}`,
                error.stack,
            );
            throw error;
        }
    }

    async sendPasswordReset(
        email: string,
        token: string,
        userName: string,
    ): Promise<void> {
        // Sử dụng backend URL để xử lý redirect đến frontend
        const url = `${this.configService.get<string>('APP_URL')}/auth/reset-password?token=${token}`;

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Đặt lại mật khẩu',
                template: './password-reset',
                context: {
                    userName,
                    url,
                    appName: 'Dịch vụ Y tế Giới tính',
                },
            });

            this.logger.log(`Password reset email sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send password reset email to ${email}`,
                error.stack,
            );
            throw error;
        }
    }

    async sendAppointmentConfirmation(
        email: string,
        appointmentDetails: {
            userName: string;
            consultantName: string;
            appointmentDate: string;
            appointmentTime: string;
            meetingLink?: string;
            serviceName: string;
            appointmentLocation: string;
        },
    ): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Xác nhận lịch hẹn tư vấn',
                template: './appointment-confirmation',
                context: {
                    ...appointmentDetails,
                    appName: 'Dịch vụ Y tế Giới tính',
                },
            });

            this.logger.log(`Appointment confirmation sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send appointment confirmation to ${email}`,
                error.stack,
            );
            throw error;
        }
    }

    async sendAppointmentReminder(
        email: string,
        appointmentDetails: {
            userName: string;
            consultantName: string;
            appointmentDate: string;
            appointmentTime: string;
            meetingLink?: string;
            serviceName: string;
        },
    ): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Nhắc nhở lịch hẹn tư vấn',
                template: './appointment-reminder',
                context: {
                    ...appointmentDetails,
                    appName: 'Dịch vụ Y tế Giới tính',
                },
            });

            this.logger.log(`Appointment reminder sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send appointment reminder to ${email}`,
                error.stack,
            );
            throw error;
        }
    }

    async sendTestResultNotification(
        email: string,
        testDetails: {
            userName: string;
            testType: string;
            resultDate: string;
            isAbnormal: boolean;
            recommendation?: string;
        },
    ): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Kết quả xét nghiệm đã có',
                template: './test-result-notification',
                context: {
                    ...testDetails,
                    appName: 'Dịch vụ Y tế Giới tính',
                    loginUrl: `${this.configService.get<string>('FRONTEND_URL')}`,
                },
            });

            this.logger.log(`Test result notification sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send test result notification to ${email}`,
                error.stack,
            );
            throw error;
        }
    }

    async sendContraceptiveReminder(
        email: string,
        reminderDetails: {
            userName: string;
            contraceptiveType: string;
            reminderMessage?: string;
        },
    ): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Nhắc nhở uống thuốc tránh thai',
                template: './contraceptive-reminder',
                context: {
                    ...reminderDetails,
                    appName: 'Dịch vụ Y tế Giới tính',
                },
            });

            this.logger.log(`Contraceptive reminder sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send contraceptive reminder to ${email}`,
                error.stack,
            );
            throw error;
        }
    }

    async sendMenstrualCycleReminder(
        email: string,
        cycleDetails: {
            userName: string;
            cycleType: 'ovulation' | 'period_start' | 'fertile_window';
            predictedDate: string;
        },
    ): Promise<void> {
        const subjects = {
            ovulation: 'Ngày rụng trứng dự kiến',
            period_start: 'Chu kỳ kinh nguyệt sắp bắt đầu',
            fertile_window: 'Thời kỳ thụ thai',
        };

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: subjects[cycleDetails.cycleType],
                template: './menstrual-cycle-reminder',
                context: {
                    ...cycleDetails,
                    appName: 'Dịch vụ Y tế Giới tính',
                },
            });

            this.logger.log(`Menstrual cycle reminder sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send menstrual cycle reminder to ${email}`,
                error.stack,
            );
            throw error;
        }
    }

    async sendWelcomeEmail(email: string, userName: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Chào mừng bạn đến với Dịch vụ Y tế Giới tính',
                template: './welcome',
                context: {
                    userName,
                    appName: 'Dịch vụ Y tế Giới tính',
                    loginUrl: `${this.configService.get<string>('FRONTEND_URL')}`,
                    supportEmail: this.configService.get<string>('MAIL_FROM'),
                },
            });

            this.logger.log(`Welcome email sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send welcome email to ${email}`,
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Gửi email thông báo khi hồ sơ tư vấn viên được CHẤP THUẬN.
     * @param email Email của tư vấn viên
     * @param userName Tên của tư vấn viên
     */
    async sendConsultantApprovalEmail(
        email: string,
        userName: string,
    ): Promise<void> {
        const loginUrl = `${this.configService.get<string>('FRONTEND_URL')}`;

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Hồ sơ tư vấn viên của bạn đã được duyệt',
                template: './consultant-approved',
                context: {
                    userName,
                    loginUrl,
                    appName: 'Dịch vụ Y tế Giới tính',
                },
            });
            this.logger.log(`Consultant approval email sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send consultant approval email to ${email}`,
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Gửi email thông báo khi hồ sơ tư vấn viên bị TỪ CHỐI.
     * @param email Email của tư vấn viên
     * @param userName Tên của tư vấn viên
     * @param reason Lý do bị từ chối
     */
    async sendConsultantRejectionEmail(
        email: string,
        userName: string,
        reason: string,
    ): Promise<void> {
        const supportEmail = this.configService.get('MAIL_FROM');

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Cập nhật về hồ sơ tư vấn viên của bạn',
                template: './consultant-rejected',
                context: {
                    userName,
                    reason,
                    supportEmail,
                    appName: 'Dịch vụ Y tế Giới tính',
                },
            });
            this.logger.log(`Consultant rejection email sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send consultant rejection email to ${email}`,
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Gửi email cho Admin/Manager khi có hồ sơ mới cần duyệt
     * @param adminEmail Email của admin/manager
     * @param adminName Tên của admin/manager
     * @param consultantName Tên của tư vấn viên mới
     * @param reviewUrl URL để xem và duyệt hồ sơ
     */
    async sendNewProfilePendingReviewEmail(
        adminEmail: string,
        adminName: string,
        consultantName: string,
        reviewUrl: string,
    ): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: adminEmail,
                subject: `[Thông báo] Có hồ sơ tư vấn viên mới cần duyệt`,
                template: './new-profile-review',
                context: {
                    adminName,
                    consultantName,
                    reviewUrl,
                    appName: 'Dịch vụ Y tế Giới tính',
                },
            });
            this.logger.log(
                `New profile review notification sent to ${adminEmail}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send new profile review email to ${adminEmail}`,
                error.stack,
            );
        }
    }

    async sendAppointmentCancellation(
        email: string,
        context: {
            recipientName: string;
            appointmentTime: string;
            cancellerName: string;
            cancellationReason: string;
        },
    ): Promise<void> {
        await this.sendEmail(
            email,
            'Thông báo: Lịch hẹn đã bị hủy',
            './appointment-cancellation',
            context,
        );
    }

    // Generic method to send custom emails
    async sendEmail(
        to: string,
        subject: string,
        template: string,
        context: any,
    ): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                template,
                context: {
                    ...context,
                    appName: 'Dịch vụ Y tế Giới tính',
                },
            });

            this.logger.log(`Email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error.stack);
            throw error;
        }
    }
}
