import { PartialType } from '@nestjs/mapped-types';
import { CreateConsultantAvailabilityDto } from './create-consultant-availability.dto';

export class UpdateConsultantAvailabilityDto extends PartialType(
    CreateConsultantAvailabilityDto,
) {}
