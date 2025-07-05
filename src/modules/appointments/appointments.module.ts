import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from '../chat/chat.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { Service } from '../services/entities/service.entity';
import { AppointmentAttendanceService } from './appointment-attendance.service';
import { AppointmentBookingService } from './appointment-booking.service';
import { AppointmentMeetingLinkService } from './appointment-meeting-link.service';
import { AppointmentNotificationService } from './appointment-notification.service';
import { AppointmentValidationService } from './appointment-validation.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment, Service]),
        ChatModule,
        MailModule,
        NotificationsModule,
        forwardRef(() => PaymentsModule),
    ],
    controllers: [AppointmentsController],
    providers: [
        AppointmentsService,
        AppointmentBookingService,
        AppointmentValidationService,
        AppointmentNotificationService,
        AppointmentAttendanceService,
        AppointmentMeetingLinkService,
    ],
    exports: [AppointmentsService, AppointmentAttendanceService],
})
export class AppointmentsModule {}
