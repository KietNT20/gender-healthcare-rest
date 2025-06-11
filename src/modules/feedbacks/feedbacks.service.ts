import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    const feedback = this.feedbackRepository.create(createFeedbackDto);
    return await this.feedbackRepository.save(feedback);
  }

  async findAll() {
    return await this.feedbackRepository.find();
  }

  async findOne(id: number) {
    return await this.feedbackRepository.findOne({ where: { id } });
  }

  async update(id: number, updateFeedbackDto: UpdateFeedbackDto) {
    await this.feedbackRepository.update(id, updateFeedbackDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.feedbackRepository.softDelete(id);
    return { message: `Feedback #${id} has been deleted` };
  }
}