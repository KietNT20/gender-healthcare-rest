import { Injectable } from '@nestjs/common';
import { CreateCycleSymptomDto } from './dto/create-cycle-symptom.dto';
import { UpdateCycleSymptomDto } from './dto/update-cycle-symptom.dto';

@Injectable()
export class CycleSymptomsService {
    create(createCycleSymptomDto: CreateCycleSymptomDto) {
        return 'This action adds a new cycleSymptom';
    }

    findAll() {
        return `This action returns all cycleSymptoms`;
    }

    findOne(id: number) {
        return `This action returns a #${id} cycleSymptom`;
    }

    update(id: number, updateCycleSymptomDto: UpdateCycleSymptomDto) {
        return `This action updates a #${id} cycleSymptom`;
    }

    remove(id: number) {
        return `This action removes a #${id} cycleSymptom`;
    }
}
