import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentServiceDto } from './create-appointment-service.dto';

export class UpdateAppointmentServiceDto extends PartialType(CreateAppointmentServiceDto) {}
