import { PartialType } from '@nestjs/swagger';
import { CreateConsultantAvailabilityDto } from './create-consultant-availability.dto';

export class UpdateConsultantAvailabilityDto extends PartialType(
    CreateConsultantAvailabilityDto,
) {}
