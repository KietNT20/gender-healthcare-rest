import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { ChatModule } from '../chat/chat.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { AppointmentAttendanceService } from './appointment-attendance.service';
import { AppointmentBookingService } from './appointment-booking.service';
import { AppointmentMeetingLinkService } from './appointment-meeting-link.service';
import { AppointmentNotificationService } from './appointment-notification.service';
import { AppointmentValidationService } from './appointment-validation.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { StiAppointmentsController } from './sti-appointments.controller';
import { StiAppointmentsService } from './sti-appointments.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment, Service, User, Category]),
        ChatModule,
        MailModule,
        NotificationsModule,
        forwardRef(() => PaymentsModule),
    ],
    controllers: [AppointmentsController, StiAppointmentsController],
    providers: [
        AppointmentsService,
        AppointmentBookingService,
        AppointmentValidationService,
        AppointmentNotificationService,
        AppointmentAttendanceService,
        AppointmentMeetingLinkService,
        StiAppointmentsService,
    ],
    exports: [
        AppointmentsService,
        AppointmentAttendanceService,
        StiAppointmentsService,
    ],
})
export class AppointmentsModule {}
