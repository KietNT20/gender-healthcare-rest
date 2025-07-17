import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from 'src/constant';
import { NotificationType } from '../notifications/processors/notification.processor';
import { Appointment } from './entities/appointment.entity';

/**
 * @class AppointmentNotificationService
 * @description Chịu trách nhiệm điều phối việc gửi email và thông báo trong ứng dụng
 * cho các sự kiện liên quan đến cuộc hẹn.
 */
@Injectable()
export class AppointmentNotificationService {
    private readonly logger = new Logger(AppointmentNotificationService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.APPOINTMENT_NOTIFICATION)
        private notificationQueue: Queue,
    ) {}

    /**
     * Gửi thông báo xác nhận khi một cuộc hẹn tư vấn được tạo.\
     * Thông báo này sẽ được gửi đến cả người dùng và tư vấn viên.
     */
    public async sendCreationNotifications(
        appointment: Appointment,
    ): Promise<void> {
        if (!appointment.consultant) {
            this.logger.warn(
                `Attempted to send creation notification for appointment ${appointment.id} without a consultant.`,
            );
            return;
        }

        const customerName = `${appointment.user.firstName} ${appointment.user.lastName}`;
        const consultantName = `${appointment.consultant.firstName} ${appointment.consultant.lastName}`;
        const appointmentDateTime = new Date(appointment.appointmentDate);
        const appointmentDate = appointmentDateTime.toLocaleDateString('vi-VN');
        const appointmentTime = appointmentDateTime.toLocaleTimeString(
            'vi-VN',
            { hour: '2-digit', minute: '2-digit' },
        );

        // Đẩy job gửi email vào queue
        await this.notificationQueue.add('send-confirmation-email', {
            email: appointment.user.email,
            data: {
                userName: customerName,
                consultantName,
                appointmentDate,
                appointmentTime,
                serviceName: appointment.services.map((s) => s.name).join(', '),
                appointmentLocation: appointment.appointmentLocation,
            },
        });

        // Đẩy job gửi notification cho user
        await this.notificationQueue.add('send-appointment-notification', {
            notificationData: {
                userId: appointment.user.id,
                title: 'Lịch hẹn đã được tạo',
                content: `Lịch hẹn của bạn với ${consultantName} vào lúc ${appointmentTime} ngày ${appointmentDate} đang chờ xác nhận.`,
                type: NotificationType.APPOINTMENT_CREATED,
                actionUrl: `/appointments/${appointment.id}`,
            },
        });

        // Đẩy job gửi notification cho consultant
        await this.notificationQueue.add('send-appointment-notification', {
            notificationData: {
                userId: appointment.consultant.id,
                title: 'Bạn có lịch hẹn mới',
                content: `Bạn có một lịch hẹn mới từ ${customerName} vào lúc ${appointmentTime} ngày ${appointmentDate}. Vui lòng xác nhận.`,
                type: NotificationType.APPOINTMENT_REQUEST,
                actionUrl: `/consultant/appointments/${appointment.id}`,
            },
        });
    }

    /**
     * Gửi thông báo khi tư vấn viên xác nhận một cuộc hẹn.
     * Thông báo này sẽ được gửi đến người dùng và có thể bao gồm thông tin chi tiết về cuộc hẹn.
     */
    public async sendConsultantConfirmationNotification(
        appointment: Appointment,
    ): Promise<void> {
        const appointmentTime = new Date(
            appointment.appointmentDate,
        ).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
        const consultantName = `${appointment.consultant?.firstName} ${appointment.consultant?.lastName}`;

        await this.notificationQueue.add('send-appointment-notification', {
            notificationData: {
                userId: appointment.user.id,
                title: 'Lịch hẹn đã được xác nhận',
                content: `Lịch hẹn của bạn với ${consultantName} vào lúc ${appointmentTime} đã được xác nhận.`,
                type: NotificationType.APPOINTMENT_CONFIRMED,
                actionUrl: `/appointments/${appointment.id}`,
            },
        });
    }

    /**
     * Gửi thông báo khi một cuộc hẹn bị hủy.
     */
    public async sendCancellationNotifications(
        appointment: Appointment,
    ): Promise<void> {
        const { user, consultant, cancelledBy, cancellationReason } =
            appointment;

        if (!user || !consultant || !cancelledBy) {
            this.logger.error(
                `Cannot send cancellation notification for appointment ${appointment.id} due to missing info.`,
            );
            return;
        }

        const cancellerName = `${cancelledBy.firstName} ${cancelledBy.lastName}`;
        const appointmentTime = new Date(
            appointment.appointmentDate,
        ).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' });
        const reasonText = cancellationReason
            ? ` với lý do: "${cancellationReason}"`
            : '';

        const recipient = user.id === cancelledBy.id ? consultant : user;
        const recipientName = `${recipient.firstName} ${recipient.lastName}`;
        const notificationTitle = 'Thông báo: Lịch hẹn đã bị hủy';

        await this.notificationQueue.add('send-appointment-notification', {
            notificationData: {
                userId: recipient.id,
                title: notificationTitle,
                content: `Lịch hẹn của bạn vào lúc ${appointmentTime} đã bị hủy bởi ${cancellerName}${reasonText}.`,
                type: NotificationType.APPOINTMENT_CANCELLED,
                actionUrl: `/appointments/${appointment.id}`,
            },
        });

        await this.notificationQueue.add('send-cancellation-email', {
            email: recipient.email,
            data: {
                recipientName,
                appointmentTime,
                cancellerName,
                cancellationReason:
                    cancellationReason || 'Không có lý do được cung cấp',
            },
        });
    }

    /**
     * Gửi thông báo nhắc nhở về một cuộc hẹn sắp diễn ra.
     * (Hàm này nên được gọi bởi một cron job)
     */
    public async sendReminderNotification(
        appointment: Appointment,
    ): Promise<void> {
        const appointmentTime = new Date(
            appointment.appointmentDate,
        ).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
        const consultantName = `${appointment.consultant?.firstName} ${appointment.consultant?.lastName}`;

        await this.notificationQueue.add('send-appointment-notification', {
            notificationData: {
                userId: appointment.user.id,
                title: 'Nhắc nhở lịch hẹn sắp tới',
                content: `Bạn có một cuộc hẹn với ${consultantName} vào lúc ${appointmentTime}. Vui lòng chuẩn bị.`,
                type: NotificationType.APPOINTMENT_REMINDER,
                actionUrl: `/appointments/${appointment.id}`,
            },
        });

        await this.notificationQueue.add('send-reminder-email', {
            email: appointment.user.email,
            data: {
                userName: `${appointment.user.firstName} ${appointment.user.lastName}`,
                consultantName,
                appointmentDate: new Date(
                    appointment.appointmentDate,
                ).toLocaleDateString('vi-VN'),
                appointmentTime: new Date(
                    appointment.appointmentDate,
                ).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                meetingLink: appointment.meetingLink,
                serviceName: appointment.services.map((s) => s.name).join(', '),
            },
        });
    }

    /**
     * Gửi thông báo khi meeting link được cập nhật
     */
    public async sendMeetingLinkNotification(
        appointment: Appointment,
    ): Promise<void> {
        const consultantName = `${appointment.consultant?.firstName} ${appointment.consultant?.lastName}`;
        const appointmentTime = new Date(
            appointment.appointmentDate,
        ).toLocaleString('vi-VN', {
            dateStyle: 'short',
            timeStyle: 'short',
        });

        await this.notificationQueue.add('send-appointment-notification', {
            notificationData: {
                userId: appointment.user.id,
                title: 'Meeting link đã được cập nhật',
                content: `${consultantName} đã cập nhật meeting link cho cuộc hẹn vào lúc ${appointmentTime}. Vui lòng kiểm tra thông tin chi tiết.`,
                type: NotificationType.MEETING_LINK_UPDATED,
                actionUrl: `/appointments/${appointment.id}`,
            },
        });
    }

    /**
     * Gửi thông báo khi thông tin cuộc hẹn được cập nhật (ví dụ: đổi lịch).
     */
    public async sendUpdateNotification(
        appointment: Appointment,
        oldTime: string,
    ): Promise<void> {
        const newTime = new Date(appointment.appointmentDate).toLocaleString(
            'vi-VN',
            { dateStyle: 'short', timeStyle: 'short' },
        );
        const title = 'Lịch hẹn đã được cập nhật';
        const content = `Lịch hẹn của bạn đã được dời từ ${oldTime} sang ${newTime}. Vui lòng kiểm tra lại thông tin chi tiết.`;

        await this.notificationQueue.add('send-appointment-notification', {
            notificationData: {
                userId: appointment.user.id,
                title,
                content,
                type: NotificationType.APPOINTMENT_UPDATED,
                actionUrl: `/appointments/${appointment.id}`,
            },
        });

        if (appointment.consultant?.id) {
            await this.notificationQueue.add('send-appointment-notification', {
                notificationData: {
                    userId: appointment.consultant.id,
                    title,
                    content: `Lịch hẹn với khách hàng ${appointment.user.firstName} ${appointment.user.lastName} đã được dời từ ${oldTime} sang ${newTime}.`,
                    type: NotificationType.APPOINTMENT_UPDATED,
                    actionUrl: `/consultant/appointments/${appointment.id}`,
                },
            });
        }
    }

    /**
     * Gửi thông báo check-in thành công
     */
    public async sendCheckInNotification(
        appointment: Appointment,
    ): Promise<void> {
        const customerName = `${appointment.user.firstName} ${appointment.user.lastName}`;
        const appointmentTime = new Date(
            appointment.appointmentDate,
        ).toLocaleString('vi-VN');

        if (appointment.consultant?.id) {
            await this.notificationQueue.add('send-appointment-notification', {
                notificationData: {
                    userId: appointment.consultant.id,
                    title: 'Bệnh nhân đã check-in',
                    content: `${customerName} đã check-in cho cuộc hẹn lúc ${appointmentTime}`,
                    type: NotificationType.PATIENT_CHECKED_IN,
                    actionUrl: `/consultant/appointments/${appointment.id}`,
                },
            });
        }
    }

    /**
     * Gửi thông báo no-show
     */
    public async sendNoShowNotification(
        appointment: Appointment,
    ): Promise<void> {
        const customerName = `${appointment.user.firstName} ${appointment.user.lastName}`;
        const appointmentTime = new Date(
            appointment.appointmentDate,
        ).toLocaleString('vi-VN');

        await this.notificationQueue.add('send-appointment-notification', {
            notificationData: {
                userId: appointment.user.id,
                title: 'Lịch hẹn bị đánh dấu No-Show',
                content: `Cuộc hẹn của bạn lúc ${appointmentTime} đã bị đánh dấu no-show do không có mặt. Vui lòng liên hệ để đặt lại lịch.`,
                type: NotificationType.APPOINTMENT_NO_SHOW,
                actionUrl: `/appointments/${appointment.id}`,
            },
        });

        await this.notificationQueue.add('send-no-show-email', {
            email: appointment.user.email,
            data: {
                userName: customerName,
                appointmentTime,
                reason: appointment.cancellationReason,
                rescheduleLink: `${process.env.FRONTEND_URL}/appointments/reschedule/${appointment.id}`,
            },
        });
    }

    /**
     * Gửi thông báo đến trễ
     */
    public async sendLateArrivalNotification(
        appointment: Appointment,
    ): Promise<void> {
        const customerName = `${appointment.user.firstName} ${appointment.user.lastName}`;
        const appointmentTime = new Date(
            appointment.appointmentDate,
        ).toLocaleString('vi-VN');
        const lateMinutes = Math.floor(
            (appointment.checkInTime!.getTime() -
                appointment.appointmentDate.getTime()) /
                (1000 * 60),
        );

        if (appointment.consultant?.id) {
            await this.notificationQueue.add('send-appointment-notification', {
                notificationData: {
                    userId: appointment.consultant.id,
                    title: 'Bệnh nhân đến trễ',
                    content: `${customerName} đã check-in trễ ${lateMinutes} phút cho cuộc hẹn lúc ${appointmentTime}`,
                    type: NotificationType.PATIENT_LATE_ARRIVAL,
                    actionUrl: `/consultant/appointments/${appointment.id}`,
                },
            });
        }
    }

    /**
     * Gửi reminder trước appointment với timeframe cụ thể
     */
    public async sendAppointmentReminder(
        appointment: Appointment,
        minutesBefore: number,
    ): Promise<void> {
        const customerName = `${appointment.user.firstName} ${appointment.user.lastName}`;
        const consultantName = appointment.consultant
            ? `${appointment.consultant.firstName} ${appointment.consultant.lastName}`
            : 'N/A';
        const appointmentTime = new Date(
            appointment.appointmentDate,
        ).toLocaleString('vi-VN');

        let reminderType = '';
        let reminderMessage = '';

        if (minutesBefore >= 24 * 60) {
            reminderType = '24h';
            reminderMessage = '24 giờ';
        } else if (minutesBefore >= 2 * 60) {
            reminderType = '2h';
            reminderMessage = '2 giờ';
        } else {
            reminderType = '30min';
            reminderMessage = '30 phút';
        }

        await this.notificationQueue.add('send-appointment-notification', {
            notificationData: {
                userId: appointment.user.id,
                title: `Nhắc nhở lịch hẹn (${reminderMessage})`,
                content: `Bạn có cuộc hẹn với ${consultantName} vào lúc ${appointmentTime}. Vui lòng chuẩn bị.`,
                type: NotificationType.APPOINTMENT_REMINDER,
                actionUrl: `/appointments/${appointment.id}`,
            },
        });

        await this.notificationQueue.add('send-reminder-email', {
            email: appointment.user.email,
            data: {
                userName: customerName,
                consultantName,
                appointmentDate: new Date(
                    appointment.appointmentDate,
                ).toLocaleDateString('vi-VN'),
                appointmentTime: new Date(
                    appointment.appointmentDate,
                ).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                meetingLink: appointment.meetingLink,
                serviceName:
                    appointment.services?.map((s) => s.name).join(', ') || '',
            },
        });
    }

    /**
     * Gửi yêu cầu feedback sau khi appointment hoàn thành
     */
    public async sendFeedbackRequest(appointment: Appointment): Promise<void> {
        await this.notificationQueue.add('send-appointment-notification', {
            notificationData: {
                userId: appointment.user.id,
                title: 'Mời bạn đánh giá cuộc hẹn',
                content: `Cảm ơn bạn đã sử dụng dịch vụ. Vui lòng để lại đánh giá cho cuộc hẹn với tư vấn viên.`,
                type: NotificationType.APPOINTMENT_FEEDBACK_REQUEST,
                actionUrl: `/appointments/${appointment.id}/feedback`,
            },
        });
    }
}
