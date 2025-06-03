import { PartialType } from '@nestjs/mapped-types';
import { CreateCycleSymptomDto } from './create-cycle-symptom.dto';

export class UpdateCycleSymptomDto extends PartialType(CreateCycleSymptomDto) {}
