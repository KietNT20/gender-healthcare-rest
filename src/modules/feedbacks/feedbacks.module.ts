// src/modules/feedbacks/feedbacks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbacksService } from './feedbacks.service';
import { FeedbacksController } from './feedbacks.controller';
import { Feedback } from './entities/feedback.entity';

@Module({
    controllers: [FeedbacksController],
    providers: [FeedbacksService],
})
export class FeedbacksModule {}
