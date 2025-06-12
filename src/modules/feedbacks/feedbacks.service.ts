import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbacksService {
    constructor(
        @InjectRepository(Feedback)
        private feedbackRepository: Repository<Feedback>,
    ) {}

    async create(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
        const feedback = this.feedbackRepository.create(createFeedbackDto);
        return this.feedbackRepository.save(feedback);
    }

    async findAll(): Promise<Feedback[]> {
    return this.feedbackRepository.find();
  }

    async findOne(id: string): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
       }
      return feedback;
  }

    async update(id: string, updateFeedbackDto: UpdateFeedbackDto): Promise<Feedback> {
    await this.feedbackRepository.update(id, updateFeedbackDto);
    return this.findOne(id);
  }

    async remove(id: string): Promise<void> {
    await this.feedbackRepository.softDelete(id);
  }
}