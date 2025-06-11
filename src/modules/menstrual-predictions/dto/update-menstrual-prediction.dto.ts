import { PartialType } from '@nestjs/mapped-types';
import { CreateMenstrualPredictionDto } from './create-menstrual-prediction.dto';

export class UpdateMenstrualPredictionDto extends PartialType(
    CreateMenstrualPredictionDto,
) {}
