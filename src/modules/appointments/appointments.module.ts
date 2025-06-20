import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentBookingService } from './appointment-booking.service';
import { AppointmentNotificationService } from './appointment-notification.service';
import { AppointmentValidationService } from './appointment-validation.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment]),
        MailModule,
        NotificationsModule,
    ],
    controllers: [AppointmentsController],
    providers: [
        AppointmentsService,
        AppointmentBookingService,
        AppointmentValidationService,
        AppointmentNotificationService,
    ],
    exports: [AppointmentsService],
})
export class AppointmentsModule {}