import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenstrualCycle } from '../menstrual-cycles/entities/menstrual-cycle.entity';
import { Symptom } from '../symptoms/entities/symptom.entity';
import { CycleSymptomsController } from './cycle-symptoms.controller';
import { CycleSymptomsService } from './cycle-symptoms.service';
import { CycleSymptom } from './entities/cycle-symptom.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([CycleSymptom, MenstrualCycle, Symptom]),
    ],
    controllers: [CycleSymptomsController],
    providers: [CycleSymptomsService],
    exports: [CycleSymptomsService],
})
export class CycleSymptomsModule {}
