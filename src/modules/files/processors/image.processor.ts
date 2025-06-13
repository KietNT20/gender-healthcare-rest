import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as sharp from 'sharp';
import { AwsS3Service } from '../aws-s3.service';
import { FilesService } from '../files.service';

export interface ImageProcessingJob {
    originalKey: string;
    userId?: string;
    type: 'avatar' | 'general';
    generateThumbnails: boolean;
    metadata?: {
        imageId?: string;
        entityType?: string;
        entityId?: string;
        altText?: string;
    };
}

export interface ThumbnailResult {
    key: string;
    url: string;
    cloudFrontUrl: string;
    width: number;
    height: number;
    size: number;
}

export interface ProcessedImageResult {
    original: {
        key: string;
        url: string;
        cloudFrontUrl: string;
        width: number;
        height: number;
        size: number;
        format: string;
    };
    thumbnails?: {
        small: ThumbnailResult;
        medium: ThumbnailResult;
        large: ThumbnailResult;
    };
    processingTime: number;
}

@Processor('image-processing')
export class ImageProcessor extends WorkerHost {
    private readonly logger = new Logger(ImageProcessor.name);

    // Image processing configurations
    private readonly imageConfig = {
        maxDimension: 2048,
        webpQuality: 85,
        webpEffort: 6,
        thumbnailQuality: 80,
        allowedFormats: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
        thumbnailSizes: {
            small: { width: 150, height: 150 },
            medium: { width: 400, height: 400 },
            large: { width: 800, height: 800 },
        },
    };

    constructor(
        private readonly s3Service: AwsS3Service,
        private readonly filesService: FilesService,
    ) {
        super();
        this.logger.log('ImageProcessor initialized');
    }

    async process(job: Job<ImageProcessingJob>): Promise<ProcessedImageResult> {
        const startTime = Date.now();
        const { originalKey, userId, type, generateThumbnails, metadata } =
            job.data;

        try {
            this.logger.log(
                `Processing image: ${originalKey} (Job ID: ${job.id})`,
            );

            // Check if original file exists
            const fileExists = await this.s3Service.fileExists(originalKey);
            if (!fileExists) {
                throw new Error(`Original file not found: ${originalKey}`);
            }

            // Get file metadata first to validate
            const fileMetadata =
                await this.s3Service.getFileMetadata(originalKey);
            this.validateImageFile(fileMetadata);

            // Download original image from S3
            const originalBuffer =
                await this.s3Service.downloadFile(originalKey);

            // Get image metadata using Sharp
            const imageInfo = await sharp(originalBuffer).metadata();
            this.validateImageMetadata(imageInfo);

            // Optimize original image
            const optimizedBuffer = await this.optimizeImage(
                originalBuffer,
                imageInfo,
            );

            // Generate new key for optimized image
            const optimizedKey = this.generateOptimizedKey(originalKey, type);

            // Upload optimized image with proper metadata
            const optimizedResult = await this.s3Service.uploadFile(
                optimizedBuffer,
                optimizedKey,
                'image/webp',
                {
                    metadata: {
                        originalFormat: imageInfo.format || 'unknown',
                        originalSize: originalBuffer.length.toString(),
                        processedAt: new Date().toISOString(),
                        processingJobId: job.id?.toString() || '',
                        userId: userId || '',
                        imageType: type,
                        ...metadata,
                    },
                    isPublic: true,
                },
            );

            const result: ProcessedImageResult = {
                original: {
                    key: optimizedKey,
                    url: optimizedResult.url,
                    cloudFrontUrl: optimizedResult.cloudFrontUrl,
                    width: imageInfo.width || 0,
                    height: imageInfo.height || 0,
                    size: optimizedBuffer.length,
                    format: 'webp',
                },
                processingTime: 0, // Will be calculated at the end
            };

            // Generate thumbnails if requested
            if (generateThumbnails) {
                result.thumbnails = await this.generateThumbnails(
                    originalBuffer,
                    originalKey,
                    type,
                    job.id?.toString(),
                );
            }

            // Delete original temporary file only if it's in temp folder
            if (originalKey.includes('/temp/')) {
                await this.s3Service.deleteFile(originalKey);
                this.logger.log(`Cleaned up temporary file: ${originalKey}`);
            }

            // Update image record in database if imageId is provided
            if (metadata?.imageId) {
                try {
                    await this.filesService.updateImageAfterProcessing(
                        metadata.imageId,
                        result,
                    );
                } catch (error) {
                    this.logger.warn(
                        `Failed to update image record ${metadata.imageId}:`,
                        error,
                    );
                }
            }

            const processingTime = Date.now() - startTime;
            result.processingTime = processingTime;

            this.logger.log(
                `Image processing completed: ${originalKey} -> ${optimizedKey} ` +
                    `(${processingTime}ms, ${this.formatBytes(originalBuffer.length)} -> ${this.formatBytes(optimizedBuffer.length)})`,
            );

            return result;
        } catch (error) {
            this.logger.error(
                `Failed to process image ${originalKey} (Job ID: ${job.id}):`,
                error,
            );

            // Clean up on error if needed
            try {
                if (originalKey.includes('/temp/')) {
                    await this.s3Service.deleteFile(originalKey);
                }
            } catch (cleanupError) {
                this.logger.warn(
                    `Failed to cleanup file on error: ${originalKey}`,
                    cleanupError,
                );
            }

            throw error;
        }
    }

    private async optimizeImage(
        buffer: Buffer,
        metadata: sharp.Metadata,
    ): Promise<Buffer> {
        const { width = 0, height = 0 } = metadata;
        const needsResize =
            width > this.imageConfig.maxDimension ||
            height > this.imageConfig.maxDimension;

        let sharpInstance = sharp(buffer);

        // Only resize if necessary
        if (needsResize) {
            sharpInstance = sharpInstance.resize(
                this.imageConfig.maxDimension,
                this.imageConfig.maxDimension,
                {
                    fit: 'inside',
                    withoutEnlargement: true,
                },
            );
        }

        return sharpInstance
            .webp({
                quality: this.imageConfig.webpQuality,
                effort: this.imageConfig.webpEffort,
            })
            .toBuffer();
    }

    private async generateThumbnails(
        originalBuffer: Buffer,
        originalKey: string,
        type: 'avatar' | 'general',
        jobId?: string,
    ): Promise<ProcessedImageResult['thumbnails']> {
        const thumbnails: Record<string, ThumbnailResult> = {};
        const uploadPromises: Promise<ThumbnailResult>[] = [];

        for (const [size, dimensions] of Object.entries(
            this.imageConfig.thumbnailSizes,
        )) {
            const promise = this.generateSingleThumbnail(
                originalBuffer,
                originalKey,
                size,
                dimensions,
                type,
                jobId,
            );
            uploadPromises.push(promise);
        }

        // Process all thumbnails concurrently
        const results = await Promise.all(uploadPromises);

        // Map results back to thumbnail object
        results.forEach((result, index) => {
            const size = Object.keys(this.imageConfig.thumbnailSizes)[index];
            thumbnails[size] = result;
        });

        return thumbnails as ProcessedImageResult['thumbnails'];
    }

    private async generateSingleThumbnail(
        originalBuffer: Buffer,
        originalKey: string,
        size: string,
        dimensions: { width: number; height: number },
        type: 'avatar' | 'general',
        jobId?: string,
    ): Promise<ThumbnailResult> {
        const thumbnailBuffer = await sharp(originalBuffer)
            .resize(dimensions.width, dimensions.height, {
                fit: type === 'avatar' ? 'cover' : 'inside',
                position: 'center',
                withoutEnlargement: false,
            })
            .webp({
                quality: this.imageConfig.thumbnailQuality,
                effort: 4, // Lower effort for thumbnails to speed up processing
            })
            .toBuffer();

        const thumbnailKey = this.generateThumbnailKey(originalKey, size, type);

        const uploadResult = await this.s3Service.uploadFile(
            thumbnailBuffer,
            thumbnailKey,
            'image/webp',
            {
                metadata: {
                    thumbnail: size,
                    originalKey,
                    imageType: type,
                    processedAt: new Date().toISOString(),
                    processingJobId: jobId || '',
                },
                isPublic: true,
            },
        );

        return {
            key: thumbnailKey,
            url: uploadResult.url,
            cloudFrontUrl: uploadResult.cloudFrontUrl,
            width: dimensions.width,
            height: dimensions.height,
            size: thumbnailBuffer.length,
        };
    }

    private generateOptimizedKey(
        originalKey: string,
        type: 'avatar' | 'general',
    ): string {
        const pathParts = originalKey.split('/');
        const filename = pathParts.pop() || '';
        const nameWithoutExt = filename.split('.')[0];
        const timestamp = Date.now();

        // Use different path based on type
        const basePath = type === 'avatar' ? 'avatars' : 'images';

        return `${basePath}/${timestamp}-${nameWithoutExt}-optimized.webp`;
    }

    private generateThumbnailKey(
        originalKey: string,
        size: string,
        type: 'avatar' | 'general',
    ): string {
        const pathParts = originalKey.split('/');
        const filename = pathParts.pop() || '';
        const nameWithoutExt = filename.split('.')[0];
        const timestamp = Date.now();

        // Use different path based on type
        const basePath = type === 'avatar' ? 'avatars' : 'images';

        return `${basePath}/thumbnails/${timestamp}-${nameWithoutExt}-${size}.webp`;
    }

    private validateImageFile(fileMetadata: any): void {
        // Check file size (max 20MB for processing)
        const maxSize = 20 * 1024 * 1024;
        if (fileMetadata.size > maxSize) {
            throw new Error(
                `File too large: ${this.formatBytes(fileMetadata.size)} (max: ${this.formatBytes(maxSize)})`,
            );
        }

        // Check content type
        if (!fileMetadata.contentType.startsWith('image/')) {
            throw new Error(`Invalid file type: ${fileMetadata.contentType}`);
        }
    }

    private validateImageMetadata(metadata: sharp.Metadata): void {
        if (
            !metadata.format ||
            !this.imageConfig.allowedFormats.includes(
                metadata.format.toLowerCase(),
            )
        ) {
            throw new Error(`Unsupported image format: ${metadata.format}`);
        }

        if (!metadata.width || !metadata.height) {
            throw new Error('Invalid image dimensions');
        }

        // Check minimum dimensions
        if (metadata.width < 10 || metadata.height < 10) {
            throw new Error(
                `Image too small: ${metadata.width}x${metadata.height} (minimum: 10x10)`,
            );
        }

        // Check maximum dimensions
        const maxDimension = 10000;
        if (metadata.width > maxDimension || metadata.height > maxDimension) {
            throw new Error(
                `Image too large: ${metadata.width}x${metadata.height} (maximum: ${maxDimension}x${maxDimension})`,
            );
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
