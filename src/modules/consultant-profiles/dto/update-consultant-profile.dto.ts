import { PartialType } from '@nestjs/swagger';
import { CreateConsultantProfileDto } from './create-consultant-profile.dto';

export class UpdateConsultantProfileDto extends PartialType(
    CreateConsultantProfileDto,
) {}
