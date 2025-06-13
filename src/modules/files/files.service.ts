import { InjectQueue } from '@nestjs/bullmq';
import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import * as path from 'path';
import { Repository } from 'typeorm';
import { Document } from '../documents/entities/document.entity';
import { Image } from '../images/entities/image.entity';
import { AwsS3Service } from './aws-s3.service';
import {
    FileResult,
    UploadDocumentOptions,
    UploadImageOptions,
} from './interfaces';

@Injectable()
export class FilesService {
    private readonly logger = new Logger(FilesService.name);

    constructor(
        private readonly s3Service: AwsS3Service,
        @InjectQueue('image-processing')
        private readonly imageQueue: Queue,
        @InjectRepository(Document)
        private readonly documentRepository: Repository<Document>,
        @InjectRepository(Image)
        private readonly imageRepository: Repository<Image>,
    ) {}

    /**
     * Upload image - for any entity (blog, service, user, etc.)
     */
    async uploadImage(options: UploadImageOptions): Promise<FileResult> {
        const {
            file,
            entityType,
            entityId,
            altText,
            isPublic = false,
            generateThumbnails = true,
        } = options;

        this.validateImageFile(file);

        try {
            // Upload to temp folder first
            const tempKey = this.s3Service.generateKey(
                'temp',
                file.originalname,
            );

            await this.s3Service.uploadFile(
                file.buffer,
                tempKey,
                file.mimetype,
                {
                    metadata: {
                        originalName: file.originalname,
                        entityType,
                        entityId,
                    },
                    isPublic: false, // Temp files are private
                },
            );

            // Save to database
            const image = this.imageRepository.create({
                name: this.generateFileName(file.originalname),
                originalName: file.originalname,
                size: file.size,
                altText,
                entityType,
                entityId,
                isPublic,
                url: '', // Will be updated after processing
            });

            const savedImage = await this.imageRepository.save(image);

            // Queue for processing
            await this.imageQueue.add('process-image', {
                originalKey: tempKey,
                type: entityType === 'user' ? 'avatar' : 'general',
                generateThumbnails,
                metadata: {
                    imageId: savedImage.id,
                    entityType,
                    entityId,
                    altText,
                },
            });

            this.logger.log(`Image uploaded and queued: ${savedImage.id}`);

            return {
                id: savedImage.id,
                url: savedImage.url || '', // Will be empty until processed
                originalName: file.originalname,
                size: file.size,
            };
        } catch (error) {
            this.logger.error('Failed to upload image:', error);
            throw error;
        }
    }

    /**
     * Upload document - for any entity (contract, blog, etc.)
     */
    async uploadDocument(options: UploadDocumentOptions): Promise<FileResult> {
        const {
            file,
            entityType,
            entityId,
            description,
            isPublic = false,
            isSensitive = false,
        } = options;

        this.validateDocumentFile(file);

        try {
            // Check for duplicates
            const fileHash = this.generateFileHash(file.buffer);
            const existingDoc = await this.documentRepository.findOne({
                where: { hash: fileHash, entityType, entityId },
            });

            if (existingDoc) {
                this.logger.log(`Document already exists: ${existingDoc.id}`);
                return {
                    id: existingDoc.id,
                    url: this.s3Service.getCloudFrontUrl(existingDoc.path),
                    originalName: existingDoc.originalName,
                    size: existingDoc.size,
                };
            }

            // Upload to S3
            const fileKey = this.s3Service.generateKey(
                'documents',
                file.originalname,
            );
            const uploadResult = await this.s3Service.uploadFile(
                file.buffer,
                fileKey,
                file.mimetype,
                {
                    metadata: {
                        originalName: file.originalname,
                        entityType,
                        entityId,
                    },
                    isPublic,
                },
            );

            // Save to database
            const document = this.documentRepository.create({
                name: this.generateFileName(file.originalname),
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                path: fileKey,
                description,
                documentType: this.getDocumentType(file.mimetype),
                entityType,
                entityId,
                isPublic,
                isSensitive,
                hash: fileHash,
                metadata: {
                    s3Key: fileKey,
                    uploadedAt: new Date().toISOString(),
                    downloadCount: 0,
                },
            });

            const savedDocument = await this.documentRepository.save(document);

            this.logger.log(`Document uploaded: ${savedDocument.id}`);

            return {
                id: savedDocument.id,
                url: uploadResult.cloudFrontUrl,
                originalName: file.originalname,
                size: file.size,
            };
        } catch (error) {
            this.logger.error('Failed to upload document:', error);
            throw error;
        }
    }

    /**
     * Get images by entity (for blog, service, etc.)
     */
    async getImagesByEntity(
        entityType: string,
        entityId: string,
    ): Promise<Image[]> {
        return this.imageRepository.find({
            where: { entityType, entityId },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Get documents by entity
     */
    async getDocumentsByEntity(
        entityType: string,
        entityId: string,
    ): Promise<Document[]> {
        return this.documentRepository.find({
            where: { entityType, entityId },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Delete image
     */
    async deleteImage(imageId: string): Promise<void> {
        const image = await this.imageRepository.findOne({
            where: { id: imageId },
        });

        if (!image) {
            throw new NotFoundException('Image not found');
        }

        try {
            // Delete from S3 if URL exists
            if (image.url) {
                const s3Key = this.extractS3KeyFromUrl(image.url);
                if (s3Key) {
                    await this.s3Service.deleteFile(s3Key);
                }
            }

            // Delete from database
            await this.imageRepository.softDelete(imageId);

            this.logger.log(`Image deleted: ${imageId}`);
        } catch (error) {
            this.logger.error(`Failed to delete image ${imageId}:`, error);
            throw error;
        }
    }

    /**
     * Delete document
     */
    async deleteDocument(documentId: string): Promise<void> {
        const document = await this.documentRepository.findOne({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        try {
            // Delete from S3
            await this.s3Service.deleteFile(document.path);

            // Delete from database
            await this.documentRepository.softDelete(documentId);

            this.logger.log(`Document deleted: ${documentId}`);
        } catch (error) {
            this.logger.error(
                `Failed to delete document ${documentId}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Download file content
     */
    async downloadFile(
        fileId: string,
        type: 'image' | 'document',
    ): Promise<{
        buffer: Buffer;
        filename: string;
        mimeType: string;
    }> {
        let file: Image | Document | null = null;
        let s3Key: string;

        if (type === 'image') {
            file = await this.imageRepository.findOne({
                where: { id: fileId },
            });
            if (!file) throw new NotFoundException('Image not found');
            s3Key = this.extractS3KeyFromUrl((file as Image).url) || '';
        } else {
            file = await this.documentRepository.findOne({
                where: { id: fileId },
            });
            if (!file) throw new NotFoundException('Document not found');
            s3Key = (file as Document).path;
        }

        try {
            const buffer = await this.s3Service.downloadFile(s3Key);
            return {
                buffer,
                filename: file.originalName,
                mimeType:
                    type === 'document'
                        ? (file as Document).mimeType
                        : 'image/*',
            };
        } catch (error) {
            this.logger.error(`Failed to download file ${fileId}:`, error);
            throw new NotFoundException('File content not found');
        }
    }

    /**
     * Update image after processing (called by ImageProcessor)
     */
    async updateImageAfterProcessing(
        imageId: string,
        processedResult: any,
    ): Promise<void> {
        await this.imageRepository.update(imageId, {
            url: processedResult.original.cloudFrontUrl,
            width: processedResult.original.width,
            height: processedResult.original.height,
            size: processedResult.original.size,
            format: processedResult.original.format,
        });

        this.logger.log(`Image updated after processing: ${imageId}`);
    }

    // Private helper methods
    private validateImageFile(file: Express.Multer.File): void {
        const maxSize = 20 * 1024 * 1024; // 20MB
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        if (file.size > maxSize) {
            throw new BadRequestException(`Image size exceeds 20MB limit`);
        }

        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Image type ${file.mimetype} not allowed`,
            );
        }
    }

    private validateDocumentFile(file: Express.Multer.File): void {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/json',
        ];

        if (file.size > maxSize) {
            throw new BadRequestException(`Document size exceeds 50MB limit`);
        }

        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Document type ${file.mimetype} not allowed`,
            );
        }
    }

    private generateFileHash(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    private generateFileName(originalName: string): string {
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${name}-${timestamp}-${random}${ext}`;
    }

    private getDocumentType(mimeType: string): string {
        const typeMap: Record<string, string> = {
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                'docx',
            'text/plain': 'txt',
            'application/json': 'json',
        };
        return typeMap[mimeType] || 'other';
    }

    private extractS3KeyFromUrl(url: string): string | null {
        try {
            // Extract key from CloudFront or S3 URL
            const urlParts = url.split('/');
            return urlParts.slice(-2).join('/'); // Get last 2 parts (folder/filename)
        } catch {
            return null;
        }
    }

    public getAwsS3Service(): AwsS3Service {
        return this.s3Service;
    }
}
