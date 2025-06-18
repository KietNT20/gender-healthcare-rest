import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenstrualCycle } from '../menstrual-cycles/entities/menstrual-cycle.entity';
import { Mood } from '../moods/entities/mood.entity';
import { CycleMoodsController } from './cycle-moods.controller';
import { CycleMoodsService } from './cycle-moods.service';
import { CycleMood } from './entities/cycle-mood.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Mood, MenstrualCycle, CycleMood])],
    controllers: [CycleMoodsController],
    providers: [CycleMoodsService],
    exports: [CycleMoodsService],
})
export class CycleMoodsModule {}
