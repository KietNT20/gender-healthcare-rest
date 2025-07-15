import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { sanitizeFilename } from 'src/utils/sanitize-name.util';
import { Repository } from 'typeorm';
import { Document } from '../documents/entities/document.entity';
import { AwsS3Service } from './aws-s3.service';
import { UploadPublicPdfMetadataDto } from './dto/upload-file.dto';
import { FileResult, UploadPublicPdfOptions } from './interfaces';

@Injectable()
export class PublicPdfService {
    private readonly logger = new Logger(PublicPdfService.name);

    constructor(
        private readonly s3Service: AwsS3Service,
        @InjectRepository(Document)
        private readonly documentRepository: Repository<Document>,
    ) {}

    /**
     * Upload public PDF directly to public bucket - no queue processing
     */
    async uploadPublicPdf(
        file: Express.Multer.File,
        uploadPublicPdfBodyDto: UploadPublicPdfMetadataDto,
    ): Promise<FileResult> {
        this.validateUploadOptions({
            file,
            entityType: uploadPublicPdfBodyDto.entityType,
            entityId: uploadPublicPdfBodyDto.entityId,
        });

        try {
            // Check for duplicates
            const fileHash = this.generateFileHash(file.buffer);
            const existingDoc = await this.findExistingDocument(
                fileHash,
                uploadPublicPdfBodyDto.entityType,
                uploadPublicPdfBodyDto.entityId,
            );

            if (existingDoc) {
                this.logger.log(`Public PDF already exists: ${existingDoc.id}`);
                return this.createFileResult(existingDoc);
            }

            // Upload directly to public bucket
            const fileKey = this.generateS3Key(file.originalname);
            const uploadResult = await this.uploadToS3(file, fileKey);

            // Save to database
            const document = await this.saveDocument({
                file,
                fileKey,
                fileHash,
                uploadResult,
                entityType: uploadPublicPdfBodyDto.entityType,
                entityId: uploadPublicPdfBodyDto.entityId,
                description: uploadPublicPdfBodyDto.description,
            });

            this.logger.log(`Public PDF uploaded: ${document.id}`);

            return {
                id: document.id,
                url: uploadResult.cloudFrontUrl,
                originalName: file.originalname,
                size: file.size,
            };
        } catch (error) {
            this.logger.error('Failed to upload public PDF:', error);
            throw error;
        }
    }

    /**
     * Get public PDFs by entity
     */
    async getPublicPdfsByEntity(
        entityType: string,
        entityId: string,
    ): Promise<Document[]> {
        const queryBuilder =
            this.documentRepository.createQueryBuilder('document');

        return queryBuilder
            .where('document.entityType = :entityType', { entityType })
            .andWhere('document.entityId = :entityId', { entityId })
            .andWhere('document.mimeType = :mimeType', {
                mimeType: 'application/pdf',
            })
            .andWhere("document.metadata->>'isPublic' = 'true'")
            .orderBy('document.createdAt', 'DESC')
            .getMany();
    }

    /**
     * Get public PDF with direct access URL
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

        this.validatePublicPdf(document);

        const accessUrl = this.getPublicAccessUrl(document);

        return {
            ...document,
            accessUrl,
        };
    }

    /**
     * Delete public PDF
     */
    async deletePublicPdf(documentId: string): Promise<void> {
        const document = await this.documentRepository.findOne({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        this.validatePublicPdf(document);

        try {
            // Delete from S3
            await this.s3Service.deleteFile(document.path);
            this.logger.log(
                `Deleted public PDF file from S3: ${document.path}`,
            );

            // Delete from database
            await this.documentRepository.softDelete(documentId);

            this.logger.log(`Public PDF deleted: ${documentId}`);
        } catch (error) {
            this.logger.error(
                `Failed to delete public PDF ${documentId}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Download public PDF content
     */
    async downloadPublicPdf(documentId: string): Promise<{
        buffer: Buffer;
        filename: string;
        mimeType: string;
    }> {
        const document = await this.documentRepository.findOne({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        this.validatePublicPdf(document);

        try {
            const buffer = await this.s3Service.downloadFile(document.path);

            // Update download stats
            this.updateDownloadStats(documentId).catch(() => {
                // Already logged in the method
            });

            return {
                buffer,
                filename: document.originalName,
                mimeType: document.mimeType,
            };
        } catch (error) {
            this.logger.error(
                `Failed to download public PDF ${documentId}:`,
                error,
            );
            throw new NotFoundException('PDF file not found');
        }
    }

    // Private helper methods

    private validateUploadOptions(options: UploadPublicPdfOptions): void {
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

        this.validatePdfFile(file);
    }

    private validatePdfFile(file: Express.Multer.File): void {
        const maxSize = 50 * 1024 * 1024; // 50MB

        if (file.size > maxSize) {
            throw new BadRequestException('PDF size exceeds 50MB limit');
        }

        if (file.mimetype !== 'application/pdf') {
            throw new BadRequestException(
                `File type ${file.mimetype} not allowed. Only PDF files are accepted.`,
            );
        }
    }

    private validatePublicPdf(document: Document): void {
        const isPublic = document.metadata?.isPublic === true;
        const isPdf = document.mimeType === 'application/pdf';

        if (!isPublic || !isPdf) {
            throw new BadRequestException('Document is not a public PDF');
        }
    }

    private generateFileHash(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    private generateS3Key(originalName: string): string {
        return this.s3Service.generateKey('documents', originalName);
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

    private async findExistingDocument(
        fileHash: string,
        entityType: string,
        entityId: string,
    ): Promise<Document | null> {
        return this.documentRepository.findOne({
            where: { hash: fileHash, entityType, entityId },
        });
    }

    private async uploadToS3(
        file: Express.Multer.File,
        fileKey: string,
    ): Promise<any> {
        return this.s3Service.uploadFile(file.buffer, fileKey, file.mimetype, {
            forcePublic: true, // Force upload to public bucket
            metadata: {
                originalName: file.originalname,
                isPublic: 'true',
            },
        });
    }

    private async saveDocument(params: {
        file: Express.Multer.File;
        fileKey: string;
        fileHash: string;
        uploadResult: any;
        entityType: string;
        entityId: string;
        description?: string;
    }): Promise<Document> {
        const {
            file,
            fileKey,
            fileHash,
            uploadResult,
            entityType,
            entityId,
            description,
        } = params;

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
            isSensitive: false,
            hash: fileHash,
            metadata: {
                s3Key: fileKey,
                uploadedAt: new Date().toISOString(),
                downloadCount: 0,
                bucketType: 'public',
                cloudFrontUrl: uploadResult.cloudFrontUrl,
                isPublic: true,
            },
        });

        return this.documentRepository.save(document);
    }

    private createFileResult(document: Document): FileResult {
        const accessUrl =
            document.metadata?.cloudFrontUrl ||
            'URL will be generated on access';

        return {
            id: document.id,
            url: accessUrl,
            originalName: document.originalName,
            size: document.size,
        };
    }

    private getPublicAccessUrl(document: Document): string {
        return (
            document.metadata?.cloudFrontUrl ||
            `${process.env.AWS_PUBLIC_CLOUDFRONT_URL}/${document.path}`
        );
    }

    private async updateDownloadStats(documentId: string): Promise<void> {
        try {
            const document = await this.documentRepository.findOne({
                where: { id: documentId },
            });

            if (!document) {
                this.logger.warn(
                    `Document ${documentId} not found for stats update`,
                );
                return;
            }

            const updatedMetadata = {
                ...document.metadata,
                downloadCount: (document.metadata?.downloadCount || 0) + 1,
                lastAccessed: new Date().toISOString(),
            };

            await this.documentRepository.save({
                id: documentId,
                metadata: updatedMetadata,
            });

            this.logger.log(
                `Updated download stats for public PDF ${documentId}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to update download stats for ${documentId}:`,
                error,
            );
        }
    }
}
