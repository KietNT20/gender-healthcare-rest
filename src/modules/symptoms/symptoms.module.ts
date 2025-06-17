import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { Symptom } from './entities/symptom.entity';
import { SymptomsController } from './symptoms.controller';
import { SymptomsService } from './symptoms.service';

@Module({
    imports: [TypeOrmModule.forFeature([Symptom, Category])],
    controllers: [SymptomsController],
    providers: [SymptomsService],
    exports: [SymptomsService],
})
export class SymptomsModule {}
