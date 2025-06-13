import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as sharp from 'sharp';
import { AwsS3Service } from '../aws-s3.service';

export interface ImageProcessingJob {
    originalKey: string;
    userId?: string;
    type: 'avatar' | 'general';
    generateThumbnails: boolean;
    metadata?: {
        entityType?: string;
        entityId?: string;
        altText?: string;
    };
}

export interface ProcessedImageResult {
    original: {
        key: string;
        url: string;
        width: number;
        height: number;
        size: number;
    };
    thumbnails?: {
        small: { key: string; url: string; width: number; height: number };
        medium: { key: string; url: string; width: number; height: number };
        large: { key: string; url: string; width: number; height: number };
    };
}

@Processor('image-processing')
export class ImageProcessor extends WorkerHost {
    private readonly logger = new Logger(ImageProcessor.name);

    constructor(private readonly s3Service: AwsS3Service) {
        super();
        this.logger.log('ImageProcessor initialized');
    }

    async process(job: Job<ImageProcessingJob>): Promise<ProcessedImageResult> {
        const { originalKey, userId, type, generateThumbnails, metadata } =
            job.data;

        try {
            this.logger.log(`Processing image: ${originalKey}`);

            // Download original image from S3
            const originalBuffer = await this.s3Service.getFile(originalKey);

            // Get image metadata
            const imageInfo = await sharp(originalBuffer).metadata();

            // Optimize original image
            const optimizedBuffer = await this.optimizeImage(originalBuffer);

            // Generate new key for optimized image
            const optimizedKey = this.generateOptimizedKey(originalKey);

            // Upload optimized image
            const optimizedResult = await this.s3Service.uploadFile(
                optimizedBuffer,
                optimizedKey,
                'image/webp', // Convert to WebP for better compression
                {
                    originalFormat: imageInfo.format || 'unknown',
                    processedAt: new Date().toISOString(),
                    ...metadata,
                },
            );

            const result: ProcessedImageResult = {
                original: {
                    key: optimizedKey,
                    url: optimizedResult.cloudFrontUrl,
                    width: imageInfo.width || 0,
                    height: imageInfo.height || 0,
                    size: optimizedBuffer.length,
                },
            };

            // Generate thumbnails if requested
            if (generateThumbnails) {
                result.thumbnails = await this.generateThumbnails(
                    originalBuffer,
                    originalKey,
                    userId,
                );
            }

            // Delete original temporary file
            await this.s3Service.deleteFile(originalKey);

            this.logger.log(`Image processing completed: ${originalKey}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to process image ${originalKey}:`, error);
            throw error;
        }
    }

    private async optimizeImage(buffer: Buffer): Promise<Buffer> {
        return sharp(buffer)
            .resize(2048, 2048, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({
                quality: 85,
                effort: 6,
            })
            .toBuffer();
    }

    private async generateThumbnails(
        originalBuffer: Buffer,
        originalKey: string,
        userId?: string,
    ): Promise<ProcessedImageResult['thumbnails']> {
        const sizes = {
            small: { width: 150, height: 150 },
            medium: { width: 400, height: 400 },
            large: { width: 800, height: 800 },
        };

        const thumbnails: any = {};

        for (const [size, dimensions] of Object.entries(sizes)) {
            const thumbnailBuffer = await sharp(originalBuffer)
                .resize(dimensions.width, dimensions.height, {
                    fit: 'cover',
                    position: 'center',
                })
                .webp({ quality: 80 })
                .toBuffer();

            const thumbnailKey = this.generateThumbnailKey(originalKey, size);

            const uploadResult = await this.s3Service.uploadFile(
                thumbnailBuffer,
                thumbnailKey,
                'image/webp',
                {
                    thumbnail: size,
                    originalKey,
                    processedAt: new Date().toISOString(),
                },
            );

            thumbnails[size] = {
                key: thumbnailKey,
                url: uploadResult.cloudFrontUrl,
                width: dimensions.width,
                height: dimensions.height,
            };
        }

        return thumbnails;
    }

    private generateOptimizedKey(originalKey: string): string {
        const pathParts = originalKey.split('/');
        const filename = pathParts.pop();
        const nameWithoutExt = filename?.split('.')[0];

        return [...pathParts, `${nameWithoutExt}-optimized.webp`].join('/');
    }

    private generateThumbnailKey(originalKey: string, size: string): string {
        const pathParts = originalKey.split('/');
        const filename = pathParts.pop();
        const nameWithoutExt = filename?.split('.')[0];

        return [...pathParts, `${nameWithoutExt}-${size}.webp`].join('/');
    }
}
