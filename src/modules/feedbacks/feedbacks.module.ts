// src/modules/feedbacks/feedbacks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbacksService } from './feedbacks.service';
import { FeedbacksController } from './feedbacks.controller';
import { Feedback } from './entities/feedback.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Feedback, User, Service, Appointment])],
    controllers: [FeedbacksController],
    providers: [FeedbacksService],
})
export class FeedbacksModule {}
