import { Processor, WorkerHost } from '@nestjs/bullmq';
import {
    BadRequestException,
    Logger,
    NotFoundException,
    PayloadTooLargeException,
    UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Job } from 'bullmq';
import * as sharp from 'sharp';
import { QUEUE_NAMES } from 'src/constant';
import { AwsS3Service, FileMetadata } from '../aws-s3.service';
import { FilesService } from '../files.service';

/**
 * @interface ImageProcessingJob
 * @description Defines the structure of the data for an image processing job.
 * @property {string} originalKey - The S3 key of the original image to be processed.
 * @property {string} [userId] - The ID of the user who uploaded the image.
 * @property {'avatar' | 'blog' | 'service' | 'news' | 'general'} type - The content type of the image, which determines processing parameters.
 * @property {boolean} isPublic - A flag to determine if the processed images should be publicly accessible.
 * @property {boolean} generateThumbnails - A flag to indicate whether to generate thumbnails.
 * @property {object} [metadata] - Optional metadata to be stored with the image.
 */
export interface ImageProcessingJob {
    originalKey: string;
    userId?: string;
    type: 'avatar' | 'blog' | 'service' | 'news' | 'general';
    isPublic: boolean;
    generateThumbnails: boolean;
    metadata?: {
        imageId?: string;
        entityType?: string;
        entityId?: string;
        altText?: string;
    };
}

/**
 * @interface ThumbnailResult
 * @description Defines the structure for a single generated thumbnail's data.
 */
export interface ThumbnailResult {
    key: string; // S3 key of the thumbnail
    url: string; // S3 URL of the thumbnail
    cloudFrontUrl: string; // CloudFront CDN URL for faster access
    width: number; // Width of the thumbnail
    height: number; // Height of the thumbnail
    size: number; // File size in bytes
}

/**
 * @interface ProcessedImageResult
 * @description Defines the structure of the result after an image has been successfully processed.
 */
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
    processingTime: number; // Time taken in milliseconds
}

/**
 * @class ImageProcessor
 * @description A BullMQ worker responsible for handling image processing jobs.
 * It downloads an image, optimizes it, generates thumbnails, and uploads the results to S3.
 */
@Processor(QUEUE_NAMES.IMAGE_PROCESSING)
export class ImageProcessor extends WorkerHost {
    private readonly logger = new Logger(ImageProcessor.name);

    // Configuration for image processing tasks.
    private readonly imageConfig = {
        maxDimension: 2048, // Max width or height for the optimized original image.
        webpQuality: 85, // Quality setting for WEBP conversion (1-100).
        webpEffort: 6, // CPU effort for WEBP encoding (0-6, higher is slower but better compression).
        thumbnailQuality: 80, // Quality for generated thumbnails.
        allowedFormats: ['jpeg', 'jpg', 'png', 'webp'], // Permitted input image formats.

        // Predefined dimensions for thumbnails based on content type, maintaining aspect ratios.
        contentDimensions: {
            avatar: {
                small: { width: 150, height: 150 }, // 1:1 ratio
                medium: { width: 300, height: 300 }, // 1:1 ratio
                large: { width: 500, height: 500 }, // 1:1 ratio
            },
            blog: {
                small: { width: 300, height: 200 }, // 3:2 ratio
                medium: { width: 600, height: 400 }, // 3:2 ratio
                large: { width: 1200, height: 800 }, // 3:2 ratio
            },
            service: {
                small: { width: 280, height: 280 }, // 1:1 ratio
                medium: { width: 400, height: 400 }, // 1:1 ratio
                large: { width: 600, height: 600 }, // 1:1 ratio
            },
            news: {
                small: { width: 320, height: 180 }, // 16:9 ratio
                medium: { width: 640, height: 360 }, // 16:9 ratio
                large: { width: 1280, height: 720 }, // 16:9 ratio
            },
            general: {
                small: { width: 300, height: 200 }, // 3:2 ratio
                medium: { width: 600, height: 400 }, // 3:2 ratio
                large: { width: 1200, height: 800 }, // 3:2 ratio
            },
        },
    };

    constructor(
        private readonly s3Service: AwsS3Service,
        private readonly filesService: FilesService,
    ) {
        super();
        this.logger.log('ImageProcessor initialized');
    }

    /**
     * @method process
     * @description The main method that processes a single image job from the queue.
     * @param {Job<ImageProcessingJob>} job - The job object from the BullMQ queue.
     * @returns {Promise<ProcessedImageResult>} The result of the image processing.
     */
    async process(job: Job<ImageProcessingJob>): Promise<ProcessedImageResult> {
        const startTime = Date.now();
        const {
            originalKey,
            userId,
            type,
            isPublic,
            generateThumbnails,
            metadata,
        } = job.data;

        try {
            this.logger.log(
                `Processing image: ${originalKey} (Job ID: ${job.id}, ${isPublic ? 'public' : 'private'})`,
            );

            // 1. Check if the original file exists in S3.
            const fileExists = await this.s3Service.fileExists(originalKey);
            if (!fileExists) {
                throw new NotFoundException(
                    `Original file not found: ${originalKey}`,
                );
            }

            // 2. Get and validate S3 file metadata (e.g., size, content-type).
            const fileMetadata =
                await this.s3Service.getFileMetadata(originalKey);
            this.validateImageFile(fileMetadata);

            // 3. Download the original image from S3 into a buffer.
            const originalBuffer =
                await this.s3Service.downloadFile(originalKey);

            // 4. Get image metadata (format, width, height) using Sharp.
            const imageInfo = await sharp(originalBuffer).metadata();
            this.validateImageMetadata(imageInfo);

            // 5. Optimize the original image (resize if needed and convert to WEBP).
            const optimizedBuffer = await this.optimizeImage(
                originalBuffer,
                imageInfo,
            );

            // 6. Generate a new S3 key for the optimized image.
            const optimizedKey = this.generateOptimizedKey(originalKey, type);

            // 7. Upload the optimized image with the specified privacy setting.
            const optimizedResult = await this.s3Service.uploadFileWithPrivacy(
                optimizedBuffer,
                optimizedKey,
                'image/webp',
                isPublic, // Use the isPublic flag from job data
                {
                    // Attach relevant metadata to the S3 object.
                    metadata: {
                        originalFormat: imageInfo.format || 'unknown',
                        originalSize: originalBuffer.length.toString(),
                        processedAt: new Date().toISOString(),
                        processingJobId: job.id?.toString() || '',
                        userId: userId || '',
                        imageType: type,
                        isPublic: isPublic.toString(),
                        ...metadata,
                    },
                },
            );

            // Prepare the initial result object.
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

            // 8. Generate thumbnails if requested in the job data.
            if (generateThumbnails) {
                result.thumbnails = await this.generateThumbnails(
                    originalBuffer,
                    originalKey,
                    type,
                    isPublic, // Pass privacy setting to thumbnails
                    job.id?.toString(),
                );
            }

            // 9. Clean up: Delete the original temporary file from the private 'temp/' folder.
            if (originalKey.includes('temp/')) {
                try {
                    await this.s3Service.deleteFile(originalKey);
                    this.logger.log(
                        `Cleaned up temporary file: ${originalKey}`,
                    );
                } catch (cleanupError) {
                    this.logger.warn(
                        `Failed to cleanup temp file ${originalKey}:`,
                        cleanupError,
                    );
                }
            }

            // 10. If an imageId is provided, update the corresponding record in the database.
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

            // Calculate final processing time.
            const processingTime = Date.now() - startTime;
            result.processingTime = processingTime;

            this.logger.log(
                `Image processing completed: ${originalKey} -> ${optimizedKey} ` +
                    `(${processingTime}ms, ${this.formatBytes(originalBuffer.length)} -> ${this.formatBytes(optimizedBuffer.length)}, ${isPublic ? 'public' : 'private'})`,
            );

            return result;
        } catch (error) {
            this.logger.error(
                `Failed to process image ${originalKey} (Job ID: ${job.id}):`,
                error,
            );

            // Attempt to clean up the temp file even on error.
            try {
                if (originalKey.includes('temp/')) {
                    await this.s3Service.deleteFile(originalKey);
                }
            } catch (cleanupError) {
                this.logger.warn(
                    `Failed to cleanup file on error: ${originalKey}`,
                    cleanupError,
                );
            }

            throw error; // Re-throw the error to mark the job as failed in BullMQ.
        }
    }

    /**
     * @private
     * @method optimizeImage
     * @description Resizes an image if it exceeds max dimensions and converts it to WEBP format.
     * @param {Buffer} buffer - The image data buffer.
     * @param {sharp.Metadata} metadata - The image's metadata (width, height).
     * @returns {Promise<Buffer>} A buffer containing the optimized image data.
     */
    private async optimizeImage(
        buffer: Buffer,
        metadata: sharp.Metadata,
    ): Promise<Buffer> {
        const { width = 0, height = 0 } = metadata;
        const needsResize =
            width > this.imageConfig.maxDimension ||
            height > this.imageConfig.maxDimension;

        let sharpInstance = sharp(buffer);

        // Only apply resize operation if the image is larger than the configured max dimension.
        if (needsResize) {
            sharpInstance = sharpInstance.resize(
                this.imageConfig.maxDimension,
                this.imageConfig.maxDimension,
                {
                    fit: 'inside', // Resizes while maintaining aspect ratio to fit within the dimensions.
                    withoutEnlargement: true, // Prevents upscaling smaller images.
                },
            );
        }

        // Convert the image to WEBP format with specified quality and effort.
        return sharpInstance
            .webp({
                quality: this.imageConfig.webpQuality,
                effort: this.imageConfig.webpEffort,
            })
            .toBuffer();
    }

    /**
     * @private
     * @method generateThumbnails
     * @description Orchestrates the generation of multiple thumbnails (small, medium, large) concurrently.
     * @param {Buffer} originalBuffer - The original image data.
     * @param {string} originalKey - The S3 key of the original image.
     * @param {'avatar' | 'blog' | 'service' | 'news' | 'general'} type - The content type.
     * @param {boolean} isPublic - The privacy setting for the thumbnails.
     * @param {string} [jobId] - The ID of the processing job.
     * @returns {Promise<ProcessedImageResult['thumbnails']>} An object containing the results for each thumbnail size.
     */
    private async generateThumbnails(
        originalBuffer: Buffer,
        originalKey: string,
        type: 'avatar' | 'blog' | 'service' | 'news' | 'general',
        isPublic: boolean,
        jobId?: string,
    ): Promise<ProcessedImageResult['thumbnails']> {
        const thumbnails: Record<string, ThumbnailResult> = {};
        const uploadPromises: Promise<ThumbnailResult>[] = [];

        // Get the specific dimensions required for the given content type.
        const sizesForType = this.imageConfig.contentDimensions[type];

        // Create a promise for each thumbnail generation and upload task.
        for (const [size, dimensions] of Object.entries(sizesForType)) {
            const promise = this.generateSingleThumbnail(
                originalBuffer,
                originalKey,
                size,
                dimensions,
                type,
                isPublic, // Pass privacy setting
                jobId,
            );
            uploadPromises.push(promise);
        }

        // Wait for all thumbnail tasks to complete.
        const results = await Promise.all(uploadPromises);

        // Map the results back to the correctly named thumbnail object.
        results.forEach((result, index) => {
            const size = Object.keys(sizesForType)[index];
            thumbnails[size] = result;
        });

        return thumbnails as ProcessedImageResult['thumbnails'];
    }

    /**
     * @private
     * @method generateSingleThumbnail
     * @description Generates, crops, and uploads a single thumbnail to S3.
     * @returns {Promise<ThumbnailResult>} The result of the single thumbnail upload.
     */
    private async generateSingleThumbnail(
        originalBuffer: Buffer,
        originalKey: string,
        size: string,
        dimensions: { width: number; height: number },
        type: 'avatar' | 'blog' | 'service' | 'news' | 'general',
        isPublic: boolean,
        jobId?: string,
    ): Promise<ThumbnailResult> {
        // Determine the crop strategy based on the content type.
        let cropPosition: sharp.Gravity;
        switch (type) {
            case 'avatar':
            case 'service':
                cropPosition = 'centre'; // Center crop for profile pictures.
                break;
            case 'blog':
            case 'news':
                cropPosition = 'attention'; // Smart crop, focuses on the most interesting part.
                break;
            default:
                cropPosition = 'centre';
        }

        // Resize, crop, and convert the image to a WEBP thumbnail.
        const thumbnailBuffer = await sharp(originalBuffer)
            .resize(dimensions.width, dimensions.height, {
                fit: 'cover', // Crop to fill the exact dimensions.
                position: cropPosition,
                withoutEnlargement: false, // Allows enlargement to meet dimensions, common for thumbnails.
            })
            .webp({
                quality: this.imageConfig.thumbnailQuality,
                effort: 4, // Use lower effort for faster thumbnail generation.
            })
            .toBuffer();

        const thumbnailKey = this.generateThumbnailKey(originalKey, size, type);

        // Upload the generated thumbnail to S3 with correct privacy.
        const uploadResult = await this.s3Service.uploadFileWithPrivacy(
            thumbnailBuffer,
            thumbnailKey,
            'image/webp',
            isPublic,
            {
                metadata: {
                    thumbnail: size,
                    originalKey,
                    imageType: type,
                    processedAt: new Date().toISOString(),
                    processingJobId: jobId || '',
                    isPublic: isPublic.toString(),
                },
            },
        );

        return {
            key: thumbnailKey,
            url: uploadResult.url,
            cloudFrontUrl: uploadResult.cloudFrontUrl,
            width: dimensions.width, // Guaranteed exact width
            height: dimensions.height, // Guaranteed exact height
            size: thumbnailBuffer.length,
        };
    }

    /**
     * @private
     * @method generateOptimizedKey
     * @description Creates a new S3 key for the optimized main image.
     * @returns {string} The new S3 key. e.g., "images/1672531200000-my-image-optimized.webp"
     */
    private generateOptimizedKey(
        originalKey: string,
        type: 'avatar' | 'blog' | 'service' | 'news' | 'general',
    ): string {
        const pathParts = originalKey.split('/');
        const filename = pathParts.pop() || '';
        const nameWithoutExt = filename.split('.')[0];
        const timestamp = Date.now();

        // Determine the base path based on image type.
        let basePath: string;
        switch (type) {
            case 'avatar':
                basePath = 'avatars';
                break;
            case 'blog':
            case 'service':
            case 'news':
            default:
                basePath = 'images';
                break;
        }

        return `${basePath}/${timestamp}-${nameWithoutExt}-optimized.webp`;
    }

    /**
     * @private
     * @method generateThumbnailKey
     * @description Creates a new S3 key for a thumbnail image.
     * @returns {string} The new S3 key. e.g., "images/thumbnails/1672531200000-my-image-small.webp"
     */
    private generateThumbnailKey(
        originalKey: string,
        size: string,
        type: 'avatar' | 'blog' | 'service' | 'news' | 'general',
    ): string {
        const pathParts = originalKey.split('/');
        const filename = pathParts.pop() || '';
        const nameWithoutExt = filename.split('.')[0];
        const timestamp = Date.now();

        // Determine the base path based on image type.
        let basePath: string;
        switch (type) {
            case 'avatar':
                basePath = 'avatars';
                break;
            case 'blog':
            case 'service':
            case 'news':
            default:
                basePath = 'images';
                break;
        }

        return `${basePath}/thumbnails/${timestamp}-${nameWithoutExt}-${size}.webp`;
    } /**
     * @private
     * @method validateImageFile
     * @description Validates the file metadata from S3 before downloading.
     * @param {FileMetadata} fileMetadata - The metadata object from S3.
     */
    private validateImageFile(fileMetadata: FileMetadata): void {
        // Check file size (max 20MB for processing).
        const maxSize = 20 * 1024 * 1024; // 20 MB
        if (fileMetadata.size > maxSize) {
            throw new PayloadTooLargeException(
                `File too large: ${this.formatBytes(fileMetadata.size)} (max: ${this.formatBytes(maxSize)})`,
            );
        }

        // Check content type.
        if (
            !fileMetadata.contentType ||
            !fileMetadata.contentType.startsWith('image/')
        ) {
            throw new BadRequestException(
                `Invalid or missing file type: ${fileMetadata.contentType}`,
            );
        }
    }

    /**
     * @private
     * @method validateImageMetadata
     * @description Validates the image properties (format, dimensions) obtained from Sharp.
     * @param {sharp.Metadata} metadata - The metadata object from Sharp.
     */
    private validateImageMetadata(metadata: sharp.Metadata): void {
        if (
            !metadata.format ||
            !this.imageConfig.allowedFormats.includes(
                metadata.format.toLowerCase(),
            )
        ) {
            throw new UnsupportedMediaTypeException(
                `Unsupported image format: ${metadata.format}`,
            );
        }

        if (!metadata.width || !metadata.height) {
            throw new BadRequestException('Invalid image dimensions');
        }

        // Check minimum dimensions.
        if (metadata.width < 10 || metadata.height < 10) {
            throw new BadRequestException(
                `Image too small: ${metadata.width}x${metadata.height} (minimum: 10x10)`,
            );
        }

        // Check maximum dimensions to prevent processing excessively large images (e.g., pixel bombs).
        const maxDimension = 10000;
        if (metadata.width > maxDimension || metadata.height > maxDimension) {
            throw new PayloadTooLargeException(
                `Image too large: ${metadata.width}x${metadata.height} (maximum: ${maxDimension}x${maxDimension})`,
            );
        }
    }

    /**
     * @private
     * @method formatBytes
     * @description A utility function to format a number of bytes into a human-readable string.
     * @param {number} bytes - The number of bytes.
     * @returns {string} The formatted string (e.g., "1.23 MB").
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
