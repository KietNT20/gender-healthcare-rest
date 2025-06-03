import { PartialType } from '@nestjs/mapped-types';
import { CreateCycleMoodDto } from './create-cycle-mood.dto';

export class UpdateCycleMoodDto extends PartialType(CreateCycleMoodDto) {}
