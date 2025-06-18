import { PartialType } from '@nestjs/swagger';
import { CreateCycleSymptomDto } from './create-cycle-symptom.dto';

export class UpdateCycleSymptomDto extends PartialType(CreateCycleSymptomDto) {}
