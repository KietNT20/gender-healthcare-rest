import { Injectable } from '@nestjs/common';
import { CreateMenstrualPredictionDto } from './dto/create-menstrual-prediction.dto';
import { UpdateMenstrualPredictionDto } from './dto/update-menstrual-prediction.dto';

@Injectable()
export class MenstrualPredictionsService {
  create(createMenstrualPredictionDto: CreateMenstrualPredictionDto) {
    return 'This action adds a new menstrualPrediction';
  }

  findAll() {
    return `This action returns all menstrualPredictions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} menstrualPrediction`;
  }

  update(id: number, updateMenstrualPredictionDto: UpdateMenstrualPredictionDto) {
    return `This action updates a #${id} menstrualPrediction`;
  }

  remove(id: number) {
    return `This action removes a #${id} menstrualPrediction`;
  }
}
