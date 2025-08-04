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
import { QUEUE_NAMES, THIRTY_DAYS } from 'src/constant';
import { SortOrder } from 'src/enums';
import { sanitizeFilename } from 'src/utils/sanitize-name.util';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Document } from '../documents/entities/document.entity';
import { Image } from '../images/entities/image.entity';
import { AwsS3Service } from './aws-s3.service';
import {
    FileResult,
    UploadDocumentOptions,
    UploadImageOptions,
    UploadPublicPdfOptions,
} from './interfaces';
import { ProcessedImageResult } from './processors/image.processor';

@Injectable()
export class FilesService {
    private readonly logger = new Logger(FilesService.name);

    constructor(
        private readonly s3Service: AwsS3Service,
        @InjectQueue(QUEUE_NAMES.IMAGE_PROCESSING) private imageQueue: Queue,
        @InjectRepository(Document)
        private readonly documentRepository: Repository<Document>,
        @InjectRepository(Image)
        private readonly imageRepository: Repository<Image>,
    ) {}

    /**
     * Upload image - can be public or private based on isPublic flag
     */
    async uploadImage(options: UploadImageOptions): Promise<FileResult> {
        this.validateUploadImageOptions(options);

        const {
            file,
            entityType,
            entityId,
            altText,
            isPublic,
            generateThumbnails,
        } = options;

        try {
            // Upload to temp folder first (always private)
            const tempKey = this.s3Service.generateKey(
                'temp',
                file.originalname,
            );

            const uploadResult = await this.s3Service.uploadFile(
                file.buffer,
                tempKey,
                file.mimetype,
                {
                    metadata: {
                        originalName: file.originalname,
                        entityType: entityType || '',
                        entityId: entityId || '',
                        isPublic: isPublic ? 'true' : 'false',
                    },
                },
            );

            // Save to database with isPublic flag
            const image = this.imageRepository.create({
                name: this.generateFileName(file.originalname),
                originalName: file.originalname,
                size: file.size,
                altText,
                entityType,
                entityId,
                isPublic, // Keep this field
                url: '', // Will be updated after processing
            });

            const savedImage = await this.imageRepository.save(image);

            // Queue for processing
            await this.imageQueue.add(QUEUE_NAMES.IMAGE_PROCESSING, {
                originalKey: tempKey,
                type: this.getImageType(entityType),
                isPublic, // Pass to processor
                generateThumbnails,
                metadata: {
                    imageId: savedImage.id,
                    entityType,
                    entityId,
                    altText,
                },
            });

            this.logger.log(
                `Image uploaded and queued: ${savedImage.id} (${isPublic ? 'public' : 'private'})`,
            );

            return {
                id: savedImage.id,
                url: uploadResult.url,
                originalName: file.originalname,
                size: file.size,
            };
        } catch (error) {
            this.logger.error('Failed to upload image:', error);
            throw error;
        }
    }

    /**
     * Upload document - always private
     */
    async uploadDocument(options: UploadDocumentOptions): Promise<FileResult> {
        this.validateUploadDocumentOptions(options);

        const {
            file,
            entityType,
            entityId,
            description,
            isSensitive = false,
            documentType,
        } = options;

        try {
            // Check for duplicates
            const fileHash = this.generateFileHash(file.buffer);
            const existingDoc = await this.documentRepository.findOne({
                where: { hash: fileHash, entityType, entityId },
            });

            if (existingDoc) {
                this.logger.log(`Document already exists: ${existingDoc.id}`);

                // Get access URL (will be signed URL for private documents)
                const accessUrl = await this.s3Service.getAccessUrl(
                    existingDoc.path,
                );

                return {
                    id: existingDoc.id,
                    url: accessUrl,
                    originalName: existingDoc.originalName,
                    size: existingDoc.size,
                };
            }

            // Upload to S3 (documents folder -> always private bucket)
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
                        entityType: entityType || '',
                        entityId: entityId || '',
                        isSensitive: isSensitive.toString(),
                    },
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
                documentType:
                    documentType || this.getDocumentType(file.mimetype),
                entityType,
                entityId,
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
                url: uploadResult.cloudFrontUrl, // This will be private CloudFront URL
                originalName: file.originalname,
                size: file.size,
            };
        } catch (error) {
            this.logger.error('Failed to upload document:', error);
            throw error;
        }
    }

    /**
     * Upload public PDF - no queue processing, direct upload to public bucket
     */
    async uploadPublicPdf(
        options: UploadPublicPdfOptions,
    ): Promise<FileResult> {
        this.validateUploadPublicPdfOptions(options);

        const { file, entityType, entityId, description } = options;

        try {
            // Check for duplicates
            const fileHash = this.generateFileHash(file.buffer);
            const existingDoc = await this.documentRepository.findOne({
                where: { hash: fileHash, entityType, entityId },
            });

            if (existingDoc) {
                this.logger.log(`Public PDF already exists: ${existingDoc.id}`);

                // Get access URL for existing document
                const accessUrl = await this.s3Service.getAccessUrl(
                    existingDoc.path,
                );

                return {
                    id: existingDoc.id,
                    url: accessUrl,
                    originalName: existingDoc.originalName,
                    size: existingDoc.size,
                };
            }

            // Upload directly to public bucket (documents folder)
            const fileKey = this.s3Service.generateKey(
                'documents',
                file.originalname,
            );

            const uploadResult = await this.s3Service.uploadFile(
                file.buffer,
                fileKey,
                file.mimetype,
                {
                    forcePublic: true, // Force upload to public bucket
                    metadata: {
                        originalName: file.originalname,
                        entityType: entityType || '',
                        entityId: entityId || '',
                        isPublic: 'true',
                    },
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
                documentType: 'pdf',
                entityType,
                entityId,
                isSensitive: false, // Public PDFs are not sensitive
                hash: fileHash,
                metadata: {
                    s3Key: fileKey,
                    uploadedAt: new Date().toISOString(),
                    downloadCount: 0,
                    bucketType: 'public',
                    cloudFrontUrl: uploadResult.cloudFrontUrl,
                    isPublic: true, // Store in metadata since entity doesn't have this field
                },
            });

            const savedDocument = await this.documentRepository.save(document);

            this.logger.log(`Public PDF uploaded: ${savedDocument.id}`);

            return {
                id: savedDocument.id,
                url: uploadResult.cloudFrontUrl, // Return public CloudFront URL
                originalName: file.originalname,
                size: file.size,
            };
        } catch (error) {
            this.logger.error('Failed to upload public PDF:', error);
            throw error;
        }
    }

    /**
     * Get image with appropriate access URL
     */
    async getImageWithAccessUrl(
        imageId: string,
        expiresIn: number = THIRTY_DAYS, // 30 days default
    ): Promise<Image & { accessUrl: string }> {
        const image = await this.imageRepository.findOne({
            where: { id: imageId },
        });

        if (!image) {
            throw new NotFoundException('Image not found');
        }

        let accessUrl: string;

        if (image.isPublic) {
            // Public image - return direct CloudFront URL
            accessUrl = image.url;
        } else {
            // Private image - generate signed URL
            const s3Key = this.extractS3KeyFromUrl(image.url);
            if (s3Key) {
                accessUrl = await this.s3Service.getAccessUrl(s3Key, expiresIn);
            } else {
                throw new NotFoundException('Image file not found');
            }
        }

        return {
            ...image,
            accessUrl,
        };
    }

    /**
     * Get images by entity (for blog, service, etc.)
     */
    async getImagesByEntity(
        entityType: string,
        entityId: string,
        includePrivate: boolean = false,
    ): Promise<Image[]> {
        const whereCondition: FindOptionsWhere<Image> = {
            entityType,
            entityId,
        };

        // If not including private, only get public images
        if (!includePrivate) {
            whereCondition.isPublic = true;
        }

        return this.imageRepository.find({
            where: whereCondition,
            order: { createdAt: SortOrder.DESC },
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
     * Get public PDFs by entity
     */
    async getPublicPdfsByEntity(
        entityType: string,
        entityId: string,
    ): Promise<Document[]> {
        const queryBuilder = this.documentRepository.createQueryBuilder('doc');

        return queryBuilder
            .where('doc.entityType = :entityType', { entityType })
            .andWhere('doc.entityId = :entityId', { entityId })
            .andWhere('doc.mimeType = :mimeType', {
                mimeType: 'application/pdf',
            })
            .andWhere("doc.metadata->>'isPublic' = 'true'")
            .orderBy('doc.createdAt', 'DESC')
            .getMany();
    }

    /**
     * Get public PDF with direct access URL (no signing needed for public files)
     */
    async getPublicPdfWithAccessUrl(
        documentId: string,
    ): Promise<Document & { accessUrl: string }> {
        const document = await this.documentRepository.findOne({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        // Check if it's a public PDF
        const isPublic = document.metadata?.isPublic === true;
        const isPdf = document.mimeType === 'application/pdf';

        if (!isPublic || !isPdf) {
            throw new BadRequestException('Document is not a public PDF');
        }

        // For public PDFs, return the CloudFront URL directly from metadata
        const accessUrl =
            document.metadata?.cloudFrontUrl ||
            (await this.s3Service.getAccessUrl(document.path));

        return {
            ...document,
            accessUrl,
        };
    }

    /**
     * Get document with access URL (signed URL for security)
     */
    async getDocumentWithAccessUrl(
        documentId: string,
        expiresIn: number = THIRTY_DAYS, // 30 days default
    ): Promise<Document & { accessUrl: string }> {
        const document = await this.documentRepository.findOne({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        // Generate signed URL for secure access
        const accessUrl = await this.s3Service.getAccessUrl(
            document.path,
            expiresIn,
        );

        return {
            ...document,
            accessUrl,
        };
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
                    this.logger.log(`Deleted image file from S3: ${s3Key}`);
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
            throw new NotFoundException(
                `Document with ID: ( ${documentId} ) not found`,
            );
        }

        try {
            // Delete from S3
            await this.s3Service.deleteFile(document.path);
            this.logger.log(`Deleted document file from S3: ${document.path}`);

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
     * Update document download statistics
     */
    private async updateDocumentDownloadStats(
        documentId: string,
    ): Promise<void> {
        try {
            // Get current document
            const document = await this.documentRepository.findOne({
                where: { id: documentId },
            });

            if (!document) {
                this.logger.warn(
                    `Document ${documentId} not found for stats update`,
                );
                return;
            }

            // Create updated metadata
            const updatedMetadata = {
                ...document.metadata,
                downloadCount: (document.metadata?.downloadCount || 0) + 1,
                lastAccessed: new Date().toISOString(),
            };

            // Update using save method (works better with JSONB)
            await this.documentRepository.save({
                id: documentId,
                metadata: updatedMetadata,
            });

            this.logger.log(
                `Updated download stats for document ${documentId}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to update download stats for ${documentId}:`,
                error,
            );
            // Don't throw error - stats update shouldn't break file download
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
            s3Key = this.extractS3KeyFromUrl(file.url) || '';
        } else {
            file = await this.documentRepository.findOne({
                where: { id: fileId },
            });
            if (!file) throw new NotFoundException('Document not found');
            s3Key = file.path;
        }

        try {
            const buffer = await this.s3Service.downloadFile(s3Key);

            // Update download count for documents - Fire and forget
            if (type === 'document') {
                // Don't await to avoid blocking download
                this.updateDocumentDownloadStats(fileId).catch(() => {
                    // Already logged in the method
                });
            }

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
        processedResult: ProcessedImageResult,
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

    /**
     * Get image type for processing based on entity
     */
    private getImageType(
        entityType?: string,
    ): 'avatar' | 'blog' | 'service' | 'news' | 'general' {
        if (!entityType) return 'general';

        switch (entityType.toLowerCase()) {
            case 'user':
                return 'avatar';
            case 'blog':
                return 'blog';
            case 'service':
                return 'service';
            case 'news':
                return 'news';
            default:
                return 'general';
        }
    }

    // Private helper methods
    private validateImageFile(file: Express.Multer.File): void {
        const maxSize = 20 * 1024 * 1024; // 20MB
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
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
        const maxSize = 100 * 1024 * 1024; // 100MB
        const allowedTypes = [
            // PDF files
            'application/pdf',
            // Text files
            'text/plain',
            'text/csv',
            'application/json',
            'application/xml',
            'text/xml',
            // Archive files
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
        ];

        if (file.size > maxSize) {
            throw new BadRequestException(`Document size exceeds 100MB limit`);
        }

        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Document type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
            );
        }
    }

    private generateFileHash(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    private generateFileName(originalName: string): string {
        const cleanName = sanitizeFilename(originalName);
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);

        const lastDot = cleanName.lastIndexOf('.');
        if (lastDot > 0) {
            const name = cleanName.substring(0, lastDot);
            const ext = cleanName.substring(lastDot);
            return `${name}_${timestamp}_${random}${ext}`;
        }
        return `${cleanName}_${timestamp}_${random}`;
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
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;

            // Remove leading slash and return the key
            return pathname.startsWith('/') ? pathname.substring(1) : pathname;
        } catch {
            return null;
        }
    }

    private validateUploadImageOptions(options: UploadImageOptions): void {
        const { file, entityType, entityId } = options;

        if (!file) {
            throw new BadRequestException('File is required');
        }

        if (!entityId) {
            throw new BadRequestException(
                'entityId is required for file tracking',
            );
        }

        if (!entityType) {
            throw new BadRequestException(
                'entityType is required for file tracking',
            );
        }

        this.validateImageFile(file);
    }

    private validateUploadDocumentOptions(
        options: UploadDocumentOptions,
    ): void {
        const { file, entityType, entityId } = options;

        if (!file) {
            throw new BadRequestException('File is required');
        }

        if (!entityId) {
            throw new BadRequestException(
                'entityId is required for file tracking',
            );
        }

        if (!entityType) {
            throw new BadRequestException(
                'entityType is required for file tracking',
            );
        }

        this.validateDocumentFile(file);
    }

    private validateUploadPublicPdfOptions(
        options: UploadPublicPdfOptions,
    ): void {
        const { file, entityType, entityId } = options;

        if (!file) {
            throw new BadRequestException('File is required');
        }

        if (!entityId) {
            throw new BadRequestException(
                'entityId is required for file tracking',
            );
        }

        if (!entityType) {
            throw new BadRequestException(
                'entityType is required for file tracking',
            );
        }

        // Validate it's a PDF file
        if (file.mimetype !== 'application/pdf') {
            throw new BadRequestException(
                'Only PDF files are allowed for public PDF upload',
            );
        }

        this.validatePublicPdfFile(file);
    }

    private validatePublicPdfFile(file: Express.Multer.File): void {
        const maxSize = 50 * 1024 * 1024; // 50MB for public PDFs

        if (file.size > maxSize) {
            throw new BadRequestException(`PDF size exceeds 50MB limit`);
        }

        if (file.mimetype !== 'application/pdf') {
            throw new BadRequestException(
                `File type ${file.mimetype} not allowed. Only PDF files are accepted.`,
            );
        }
    }

    public getAwsS3Service(): AwsS3Service {
        return this.s3Service;
    }
}
