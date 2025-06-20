import { BullModule } from '@nestjs/bullmq';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenstrualCycle } from '../menstrual-cycles/entities/menstrual-cycle.entity';
import { MenstrualCyclesModule } from '../menstrual-cycles/menstrual-cycles.module';
import { User } from '../users/entities/user.entity';
import { MenstrualPrediction } from './entities/menstrual-prediction.entity';
import { MenstrualPredictionsController } from './menstrual-predictions.controller';
import { MenstrualPredictionsService } from './menstrual-predictions.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([MenstrualPrediction, User, MenstrualCycle]),
        forwardRef(() => MenstrualCyclesModule),
        BullModule.registerQueue({
            name: 'notification-queue',
        }),
    ],
    controllers: [MenstrualPredictionsController],
    providers: [MenstrualPredictionsService],
    exports: [MenstrualPredictionsService],
})
export class MenstrualPredictionsModule {}
