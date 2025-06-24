// src/modules/feedbacks/feedbacks-image.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Feedback } from './entities/feedback.entity';
import { Repository } from 'typeorm';
import { Image } from '../images/entities/image.entity';
import { CreateFeedbackImageDTO } from './dto/create-feedback-image.dto';

@Injectable()
export class FeedbackImageService {
    constructor(
        @InjectRepository(Feedback)
        private readonly feedbackRepository: Repository<Feedback>,
        @InjectRepository(Image)
        private readonly imageRepository: Repository<Image>,
    ) {}

    async syncFeedbackImages(feedbackId: string): Promise<void> {
        const feedback = await this.feedbackRepository.findOne({
            where: { id: feedbackId },
            relations: ['images'],
        });

        if (!feedback) {
            throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
        }

        const images = await this.imageRepository.find({
            where: {
                entityType: 'feedback',
                entityId: feedbackId,
            },
        });

        feedback.images = images;
        await this.feedbackRepository.save(feedback);
    }

    async addImageToFeedback(createFeedbackImageDTO: CreateFeedbackImageDTO): Promise<void> {
        const { feedbackId, imageId } = createFeedbackImageDTO;
        const feedback = await this.feedbackRepository.findOne({
            where: { id: feedbackId },
            relations: ['images'],
        });

        if (!feedback) {
            throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
        }

        const image = await this.imageRepository.findOne({
            where: {
                id: imageId,
                entityType: 'feedback',
                entityId: feedbackId,
            },
        });

        if (!image) {
            throw new NotFoundException(
                `Image with ID ${imageId} not found or not associated with feedback`,
            );
        }

        if (!feedback.images.some((img) => img.id === imageId)) {
            feedback.images.push(image);
            await this.feedbackRepository.save(feedback);
        }
    }

    async removeImageFromFeedback(createFeedbackImageDTO: CreateFeedbackImageDTO): Promise<void> {
        const { feedbackId, imageId } = createFeedbackImageDTO;
        const feedback = await this.feedbackRepository.findOne({
            where: { id: feedbackId },
            relations: ['images'],
        });

        if (!feedback) {
            throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
        }

        feedback.images = feedback.images.filter((img) => img.id !== imageId);
        await this.feedbackRepository.save(feedback);
    }
}