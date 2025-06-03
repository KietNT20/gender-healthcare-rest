import { Module } from '@nestjs/common';
import { CycleMoodsService } from './cycle-moods.service';
import { CycleMoodsController } from './cycle-moods.controller';

@Module({
  controllers: [CycleMoodsController],
  providers: [CycleMoodsService],
})
export class CycleMoodsModule {}
