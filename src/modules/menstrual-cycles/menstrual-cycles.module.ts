import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenstrualPredictionsModule } from 'src/modules/menstrual-predictions/menstrual-predictions.module';
import { User } from 'src/modules/users/entities/user.entity';
import { MenstrualCycle } from './entities/menstrual-cycle.entity';
import { MenstrualCyclesController } from './menstrual-cycles.controller';
import { MenstrualCyclesService } from './menstrual-cycles.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([MenstrualCycle, User]),
        forwardRef(() => MenstrualPredictionsModule),
    ],
    controllers: [MenstrualCyclesController],
    providers: [MenstrualCyclesService],
    exports: [MenstrualCyclesService],
})
export class MenstrualCyclesModule {}
