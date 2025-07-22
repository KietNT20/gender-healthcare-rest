import { BullModule } from '@nestjs/bullmq';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from 'src/constant';
import { MenstrualPredictionsModule } from 'src/modules/menstrual-predictions/menstrual-predictions.module';
import { User } from 'src/modules/users/entities/user.entity';
import { MenstrualCycle } from './entities/menstrual-cycle.entity';
import { MenstrualCyclesController } from './menstrual-cycles.controller';
import { MenstrualCyclesService } from './menstrual-cycles.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([MenstrualCycle, User]),
        BullModule.registerQueue({
            name: QUEUE_NAMES.NOTIFICATION_QUEUE,
        }),
        forwardRef(() => MenstrualPredictionsModule),
    ],
    controllers: [MenstrualCyclesController],
    providers: [MenstrualCyclesService],
    exports: [MenstrualCyclesService],
})
export class MenstrualCyclesModule {}
