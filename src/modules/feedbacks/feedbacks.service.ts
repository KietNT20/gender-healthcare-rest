import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbacksService {
    create(createFeedbackDto: CreateFeedbackDto) {
        return 'This action adds a new feedback';
    }

    findAll() {
        return `This action returns all feedbacks`;
    }

    findOne(id: number) {
        return `This action returns a #${id} feedback`;
    }

    update(id: number, updateFeedbackDto: UpdateFeedbackDto) {
        return `This action updates a #${id} feedback`;
    }

    remove(id: number) {
        return `This action removes a #${id} feedback`;
    }
}
