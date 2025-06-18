import { PartialType } from '@nestjs/swagger';
import { CreateCycleMoodDto } from './create-cycle-mood.dto';

export class UpdateCycleMoodDto extends PartialType(CreateCycleMoodDto) {}
