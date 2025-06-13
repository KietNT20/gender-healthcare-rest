import { InjectQueue } from '@nestjs/bullmq';
import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue, QueueEvents } from 'bullmq';
import * as path from 'path';
import { Repository } from 'typeorm';
import { Document } from '../documents/entities/document.entity';
import { Image } from '../images/entities/image.entity';
import { AwsS3Service } from './aws-s3.service';
import awsConfig from './config/aws.config';
import {
    BulkUploadDto,
    FileUploadResponseDto,
    UploadDocumentDto,
    UploadImageDto,
} from './dto/upload-file.dto';
import {
    ImageProcessingJob,
    ProcessedImageResult,
} from './processors/image.processor';

@Injectable()
export class FilesService {
    private readonly logger = new Logger(FilesService.name);
    constructor(
        @InjectRepository(Image)
        private readonly imageRepository: Repository<Image>,
        @InjectRepository(Document)
        private readonly documentRepository: Repository<Document>,
        private readonly s3Service: AwsS3Service,
        @InjectQueue('image-processing')
        private readonly imageQueue: Queue,
        @Inject(awsConfig.KEY)
        private readonly awsConfiguration: ConfigType<typeof awsConfig>,
    ) {}

    async uploadImage(
        file: Express.Multer.File,
        uploadDto: UploadImageDto,
        userId: string,
    ): Promise<FileUploadResponseDto> {
        this.validateImageFile(file);

        try {
            // Upload to temporary location first
            const tempKey = this.s3Service.generateKey(
                'temp',
                this.sanitizeFilename(file.originalname),
                userId,
            );

            await this.s3Service.uploadFile(
                file.buffer,
                tempKey,
                file.mimetype,
                {
                    userId,
                    originalName: file.originalname,
                    uploadedAt: new Date().toISOString(),
                },
            );

            // Create image record
            const imageData = {
                name: this.sanitizeFilename(file.originalname),
                originalName: file.originalname,
                size: file.size,
                format: path.extname(file.originalname).substring(1),
                altText: uploadDto.altText,
                entityType: uploadDto.entityType,
                entityId: uploadDto.entityId,
                isPublic: uploadDto.isPublic ?? true,
                userId,
                url: '', // Will be updated after processing
            };

            const image = this.imageRepository.create(imageData);
            const savedImage = await this.imageRepository.save(image);

            // Queue image processing
            const job: ImageProcessingJob = {
                originalKey: tempKey,
                userId,
                type:
                    uploadDto.entityType === 'user_profile'
                        ? 'avatar'
                        : 'general',
                generateThumbnails: uploadDto.generateThumbnails ?? true,
                metadata: {
                    entityType: uploadDto.entityType,
                    entityId: uploadDto.entityId,
                    altText: uploadDto.altText,
                },
            };

            const processingJob = await this.imageQueue.add(
                'process-image',
                job,
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            );

            const queueEvents = new QueueEvents('image-processing', {
                connection: this.imageQueue.opts.connection,
            });

            try {
                const result = (await processingJob.waitUntilFinished(
                    queueEvents,
                    30000,
                )) as ProcessedImageResult;

                await this.updateImageAfterProcessing(savedImage.id, result);

                return this.toFileUploadResponse(savedImage, result);
            } finally {
                await queueEvents.close();
            }
        } catch (error) {
            this.logger.error('Failed to upload image:', error);
            throw new BadRequestException('Failed to upload image');
        }
    }

    async uploadDocument(
        file: Express.Multer.File,
        uploadDto: UploadDocumentDto,
        userId: string,
    ): Promise<FileUploadResponseDto> {
        this.validateDocumentFile(file);

        try {
            const fileKey = this.s3Service.generateKey(
                'documents',
                this.sanitizeFilename(file.originalname),
                userId,
            );

            const uploadResult = await this.s3Service.uploadFile(
                file.buffer,
                fileKey,
                file.mimetype,
                {
                    userId,
                    originalName: file.originalname,
                    documentType: uploadDto.documentType || 'general',
                    uploadedAt: new Date().toISOString(),
                },
            );

            // Calculate file hash for deduplication
            const crypto = require('crypto');
            const hash = crypto
                .createHash('sha256')
                .update(file.buffer)
                .digest('hex');

            const documentData = {
                name:
                    uploadDto.name || this.sanitizeFilename(file.originalname),
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                path: uploadResult.key,
                description: uploadDto.description,
                documentType: uploadDto.documentType,
                entityType: uploadDto.entityType,
                entityId: uploadDto.entityId,
                isPublic: uploadDto.isPublic ?? false,
                isSensitive: uploadDto.isSensitive ?? false,
                userId,
                hash,
                metadata: {
                    cloudFrontUrl: uploadResult.cloudFrontUrl,
                    s3Url: uploadResult.url,
                },
            };

            const document = this.documentRepository.create(documentData);
            const savedDocument = await this.documentRepository.save(document);

            return {
                id: savedDocument.id,
                url: uploadResult.url,
                cloudFrontUrl: uploadResult.cloudFrontUrl,
                name: savedDocument.name,
                originalName: savedDocument.originalName,
                mimeType: savedDocument.mimeType,
                size: savedDocument.size,
                key: uploadResult.key,
            };
        } catch (error) {
            this.logger.error('Failed to upload document:', error);
            throw new BadRequestException('Failed to upload document');
        }
    }

    async uploadMultipleFiles(
        files: Express.Multer.File[],
        uploadDto: BulkUploadDto,
        userId: string,
    ): Promise<FileUploadResponseDto[]> {
        const results: FileUploadResponseDto[] = [];

        for (const file of files) {
            try {
                if (this.isImageFile(file)) {
                    const imageDto: UploadImageDto = {
                        entityType: uploadDto.entityType,
                        entityId: uploadDto.entityId,
                        isPublic: uploadDto.isPublic,
                        generateThumbnails: true,
                    };
                    const result = await this.uploadImage(
                        file,
                        imageDto,
                        userId,
                    );
                    results.push(result);
                } else if (this.isDocumentFile(file)) {
                    const documentDto: UploadDocumentDto = {
                        entityType: uploadDto.entityType,
                        entityId: uploadDto.entityId,
                        isPublic: uploadDto.isPublic,
                    };
                    const result = await this.uploadDocument(
                        file,
                        documentDto,
                        userId,
                    );
                    results.push(result);
                } else {
                    this.logger.warn(`Unsupported file type: ${file.mimetype}`);
                }
            } catch (error) {
                this.logger.error(
                    `Failed to upload file ${file.originalname}:`,
                    error,
                );
                // Continue with other files
            }
        }

        return results;
    }

    async deleteImage(imageId: string, userId: string): Promise<void> {
        const image = await this.imageRepository.findOne({
            where: { id: imageId, user: { id: userId } },
        });

        if (!image) {
            throw new NotFoundException('Image not found');
        }

        try {
            // Delete from S3 (extract key from URL)
            const key = this.extractKeyFromUrl(image.url);
            if (key) {
                await this.s3Service.deleteFile(key);

                // Also delete thumbnails if exist
                const baseName = path.basename(key, path.extname(key));
                const directory = path.dirname(key);

                const thumbnailSizes = ['small', 'medium', 'large'];
                for (const size of thumbnailSizes) {
                    const thumbnailKey = `${directory}/${baseName}-${size}.webp`;
                    try {
                        await this.s3Service.deleteFile(thumbnailKey);
                    } catch (error) {
                        // Thumbnail might not exist, continue
                    }
                }
            }

            // Delete from database
            await this.imageRepository.remove(image);
        } catch (error) {
            this.logger.error(`Failed to delete image ${imageId}:`, error);
            throw new BadRequestException('Failed to delete image');
        }
    }

    async deleteDocument(documentId: string, userId: string): Promise<void> {
        const document = await this.documentRepository.findOne({
            where: { id: documentId, user: { id: userId } },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        try {
            // Delete from S3
            if (document.path) {
                await this.s3Service.deleteFile(document.path);
            }

            // Delete from database
            await this.documentRepository.remove(document);
        } catch (error) {
            this.logger.error(
                `Failed to delete document ${documentId}:`,
                error,
            );
            throw new BadRequestException('Failed to delete document');
        }
    }

    async getImageById(imageId: string): Promise<Image> {
        const image = await this.imageRepository.findOne({
            where: { id: imageId },
        });

        if (!image) {
            throw new NotFoundException('Image not found');
        }

        return image;
    }

    async getDocumentById(documentId: string): Promise<Document> {
        const document = await this.documentRepository.findOne({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        return document;
    }

    async getSignedUrl(
        fileId: string,
        type: 'image' | 'document',
    ): Promise<string> {
        let key: string;

        if (type === 'image') {
            const image = await this.getImageById(fileId);
            key = this.extractKeyFromUrl(image.url) || '';
        } else {
            const document = await this.getDocumentById(fileId);
            key = document.path;
        }

        if (!key) {
            throw new BadRequestException('File key not found');
        }

        return this.s3Service.getSignedUrl(key, 3600); // 1 hour expiry
    }

    private validateImageFile(file: Express.Multer.File): void {
        if (!this.awsConfiguration.allowedImageTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid image type. Allowed types: ${this.awsConfiguration.allowedImageTypes.join(', ')}`,
            );
        }

        if (file.size > this.awsConfiguration.maxFileSize.image) {
            throw new BadRequestException(
                `Image too large. Maximum size: ${this.awsConfiguration.maxFileSize.image / 1024 / 1024}MB`,
            );
        }
    }

    private validateDocumentFile(file: Express.Multer.File): void {
        if (
            !this.awsConfiguration.allowedDocumentTypes.includes(file.mimetype)
        ) {
            throw new BadRequestException(
                `Invalid document type. Allowed types: ${this.awsConfiguration.allowedDocumentTypes.join(', ')}`,
            );
        }

        if (file.size > this.awsConfiguration.maxFileSize.document) {
            throw new BadRequestException(
                `Document too large. Maximum size: ${this.awsConfiguration.maxFileSize.document / 1024 / 1024}MB`,
            );
        }
    }

    private isImageFile(file: Express.Multer.File): boolean {
        return this.awsConfiguration.allowedImageTypes.includes(file.mimetype);
    }

    private isDocumentFile(file: Express.Multer.File): boolean {
        return this.awsConfiguration.allowedDocumentTypes.includes(
            file.mimetype,
        );
    }

    private sanitizeFilename(filename: string): string {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_{2,}/g, '_')
            .toLowerCase();
    }

    private extractKeyFromUrl(url: string): string | null {
        try {
            const urlParts = url.split('/');
            const keyIndex = urlParts.findIndex((part) => part === 'uploads');
            return keyIndex !== -1 ? urlParts.slice(keyIndex).join('/') : null;
        } catch {
            return null;
        }
    }

    private async updateImageAfterProcessing(
        imageId: string,
        result: ProcessedImageResult,
    ): Promise<void> {
        const updateData: Partial<Image> = {
            url: result.original.url,
            width: result.original.width,
            height: result.original.height,
            size: result.original.size,
        };

        await this.imageRepository.update(imageId, updateData);
    }

    private toFileUploadResponse(
        image: Image,
        result?: ProcessedImageResult,
    ): FileUploadResponseDto {
        const response: FileUploadResponseDto = {
            id: image.id,
            url: result?.original.url || image.url,
            cloudFrontUrl: result?.original.url || image.url,
            name: image.name,
            originalName: image.originalName,
            mimeType: `image/${image.format}`,
            size: result?.original.size || image.size,
            key:
                this.extractKeyFromUrl(result?.original.url || image.url) || '',
        };

        if (result?.thumbnails) {
            response.thumbnails = {
                small: result.thumbnails.small.url,
                medium: result.thumbnails.medium.url,
                large: result.thumbnails.large.url,
            };
        }

        return response;
    }
}
