import { PartialType } from '@nestjs/swagger';
import { CreateMenstrualCycleDto } from './create-menstrual-cycle.dto';

export class UpdateMenstrualCycleDto extends PartialType(
    CreateMenstrualCycleDto,
) {}
