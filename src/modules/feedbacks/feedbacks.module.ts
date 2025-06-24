// src/modules/feedbacks/feedbacks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbacksService } from './feedbacks.service';
import { FeedbacksController } from './feedbacks.controller';
import { Feedback } from './entities/feedback.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { FeedbackImageService } from './feedbacks-image.service';
import { ImagesModule } from '../images/images.module';
import { Image } from '../images/entities/image.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Feedback, User, Service, Appointment,Image]),
        ImagesModule,
    ],
    controllers: [FeedbacksController],
    providers: [FeedbacksService, FeedbackImageService],
    exports: [FeedbacksService, FeedbackImageService],
})
export class FeedbacksModule {}
