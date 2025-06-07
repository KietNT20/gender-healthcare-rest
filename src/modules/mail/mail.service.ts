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

  async sendEmailVerification(email: string, token: string, userName: string) {
    const url = `${this.configService.get('APP_URL')}/auth/verify-email?token=${token}`;

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

  async sendPasswordReset(email: string, token: string, userName: string) {
    const url = `${this.configService.get('APP_URL')}/auth/reset-password?token=${token}`;

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
  ) {
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
  ) {
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
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Kết quả xét nghiệm đã có',
        template: './test-result-notification',
        context: {
          ...testDetails,
          appName: 'Dịch vụ Y tế Giới tính',
          loginUrl: `${this.configService.get('APP_URL')}/login`,
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
  ) {
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
  ) {
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

  async sendWelcomeEmail(email: string, userName: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Chào mừng bạn đến với Dịch vụ Y tế Giới tính',
        template: './welcome',
        context: {
          userName,
          appName: 'Dịch vụ Y tế Giới tính',
          loginUrl: `${this.configService.get('APP_URL')}/login`,
          supportEmail: this.configService.get('MAIL_FROM'),
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

  // Generic method to send custom emails
  async sendEmail(to: string, subject: string, template: string, context: any) {
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

      this.logger.log(`Custom email sent to ${to} with template ${template}`);
    } catch (error) {
      this.logger.error(`Failed to send custom email to ${to}`, error.stack);
      throw error;
    }
  }
}
