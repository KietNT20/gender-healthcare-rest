import { Module } from '@nestjs/common';
import { MenstrualCyclesService } from './menstrual-cycles.service';
import { MenstrualCyclesController } from './menstrual-cycles.controller';

@Module({
  controllers: [MenstrualCyclesController],
  providers: [MenstrualCyclesService],
})
export class MenstrualCyclesModule {}
