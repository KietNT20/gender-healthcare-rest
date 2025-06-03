import { Module } from '@nestjs/common';
import { AppointmentServicesService } from './appointment-services.service';
import { AppointmentServicesController } from './appointment-services.controller';

@Module({
  controllers: [AppointmentServicesController],
  providers: [AppointmentServicesService],
})
export class AppointmentServicesModule {}
