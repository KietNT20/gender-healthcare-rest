import { PartialType } from '@nestjs/mapped-types';
import { CreateMenstrualCycleDto } from './create-menstrual-cycle.dto';

export class UpdateMenstrualCycleDto extends PartialType(
    CreateMenstrualCycleDto,
) {}
