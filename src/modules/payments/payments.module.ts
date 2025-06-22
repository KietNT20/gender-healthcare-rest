import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ServicePackagesModule } from '../service-packages/service-packages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Appointment, User]),
    AppointmentsModule,
    ServicePackagesModule, // Thêm ServicePackagesModule
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}