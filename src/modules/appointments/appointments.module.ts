import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Payment, User, Service])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}