import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MenstrualPredictionsService } from './menstrual-predictions.service';
import { CreateMenstrualPredictionDto } from './dto/create-menstrual-prediction.dto';
import { UpdateMenstrualPredictionDto } from './dto/update-menstrual-prediction.dto';

@Controller('menstrual-predictions')
export class MenstrualPredictionsController {
  constructor(private readonly menstrualPredictionsService: MenstrualPredictionsService) {}

  @Post()
  create(@Body() createMenstrualPredictionDto: CreateMenstrualPredictionDto) {
    return this.menstrualPredictionsService.create(createMenstrualPredictionDto);
  }

  @Get()
  findAll() {
    return this.menstrualPredictionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menstrualPredictionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMenstrualPredictionDto: UpdateMenstrualPredictionDto) {
    return this.menstrualPredictionsService.update(+id, updateMenstrualPredictionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menstrualPredictionsService.remove(+id);
  }
}
