// src/modules/feedbacks/feedbacks.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Post()
  async create(@Body() dto: CreateFeedbackDto) {
    return this.feedbacksService.create(dto);
  }

  @Get()
  async findAll() {
    return this.feedbacksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.feedbacksService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFeedbackDto) {
    return this.feedbacksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.feedbacksService.remove(id);
  }
}
