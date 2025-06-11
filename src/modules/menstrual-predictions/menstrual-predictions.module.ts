import { Module } from '@nestjs/common';
import { MenstrualPredictionsService } from './menstrual-predictions.service';
import { MenstrualPredictionsController } from './menstrual-predictions.controller';

@Module({
  controllers: [MenstrualPredictionsController],
  providers: [MenstrualPredictionsService],
})
export class MenstrualPredictionsModule {}
