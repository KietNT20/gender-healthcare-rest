import { PartialType } from '@nestjs/mapped-types';
import { CreateConsultantProfileDto } from './create-consultant-profile.dto';

export class UpdateConsultantProfileDto extends PartialType(CreateConsultantProfileDto) {}
