import { Injectable } from '@nestjs/common';
import { CreateCycleMoodDto } from './dto/create-cycle-mood.dto';
import { UpdateCycleMoodDto } from './dto/update-cycle-mood.dto';

@Injectable()
export class CycleMoodsService {
  create(createCycleMoodDto: CreateCycleMoodDto) {
    return 'This action adds a new cycleMood';
  }

  findAll() {
    return `This action returns all cycleMoods`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cycleMood`;
  }

  update(id: number, updateCycleMoodDto: UpdateCycleMoodDto) {
    return `This action updates a #${id} cycleMood`;
  }

  remove(id: number) {
    return `This action removes a #${id} cycleMood`;
  }
}
