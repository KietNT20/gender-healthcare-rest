import { Injectable } from '@nestjs/common';
import { CreateMenstrualCycleDto } from './dto/create-menstrual-cycle.dto';
import { UpdateMenstrualCycleDto } from './dto/update-menstrual-cycle.dto';

@Injectable()
export class MenstrualCyclesService {
    create(createMenstrualCycleDto: CreateMenstrualCycleDto) {
        return 'This action adds a new menstrualCycle';
    }

    findAll() {
        return `This action returns all menstrualCycles`;
    }

    findOne(id: number) {
        return `This action returns a #${id} menstrualCycle`;
    }

    update(id: number, updateMenstrualCycleDto: UpdateMenstrualCycleDto) {
        return `This action updates a #${id} menstrualCycle`;
    }

    remove(id: number) {
        return `This action removes a #${id} menstrualCycle`;
    }
}
