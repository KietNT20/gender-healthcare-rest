import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import awsConfig from './config/aws.config';

export interface UploadResult {
    key: string;
    url: string;
    cloudFrontUrl: string;
    bucket: string;
    size: number;
    contentType: string;
    etag?: string;
}

export interface FileMetadata {
    size: number;
    contentType: string;
    lastModified: Date;
    etag: string;
    metadata?: Record<string, string>;
}

export interface UploadOptions {
    metadata?: Record<string, string>;
    isPublic?: boolean;
    expires?: number;
}

@Injectable()
export class AwsS3Service {
    private readonly logger = new Logger(AwsS3Service.name);
    private readonly s3Client: S3Client;

    // Allowed file types for security
    private readonly allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/json',
        // Add more as needed
    ];

    // Max file size (10MB)
    private readonly maxFileSize = 10 * 1024 * 1024;

    constructor(
        @Inject(awsConfig.KEY)
        private readonly awsConfiguration: ConfigType<typeof awsConfig>,
    ) {
        this.s3Client = new S3Client({
            region: this.awsConfiguration.awsRegion,
            credentials: {
                accessKeyId: this.awsConfiguration.awsAccessKeyId as string,
                secretAccessKey: this.awsConfiguration
                    .awsSecretAccessKey as string,
            },
        });
    }

    /**
     * Upload file to S3 with validation
     */
    async uploadFile(
        file: Buffer,
        key: string,
        contentType: string,
        options: UploadOptions = {},
    ): Promise<UploadResult> {
        // Validate file
        this.validateFile(file, contentType);

        try {
            const command = new PutObjectCommand({
                Bucket: this.awsConfiguration.awsBucketName,
                Key: key,
                Body: file,
                ContentType: contentType,
                Metadata: options.metadata,
                ACL: options.isPublic !== false ? 'public-read' : undefined,
                Expires: options.expires
                    ? new Date(Date.now() + options.expires * 1000)
                    : undefined,
            });

            const response = await this.s3Client.send(command);

            const url = this.generateS3Url(key);
            const cloudFrontUrl = this.getCloudFrontUrl(key);

            this.logger.log(
                `File uploaded successfully: ${key} (${file.length} bytes)`,
            );

            return {
                key,
                url,
                cloudFrontUrl,
                bucket: this.awsConfiguration.awsBucketName as string,
                size: file.length,
                contentType,
                etag: response.ETag,
            };
        } catch (error) {
            this.logger.error(`Failed to upload file ${key}:`, error);
            throw error;
        }
    }

    /**
     * Download file from S3
     */
    async downloadFile(key: string): Promise<Buffer> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.awsConfiguration.awsBucketName,
                Key: key,
            });

            const response = await this.s3Client.send(command);

            if (!response.Body) {
                throw new Error('File body is empty');
            }

            const chunks: Uint8Array[] = [];
            const stream = response.Body as any;

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);
            this.logger.log(
                `File downloaded successfully: ${key} (${buffer.length} bytes)`,
            );

            return buffer;
        } catch (error) {
            this.logger.error(`Failed to download file ${key}:`, error);
            throw error;
        }
    }

    /**
     * Delete file from S3
     */
    async deleteFile(key: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.awsConfiguration.awsBucketName,
                Key: key,
            });

            await this.s3Client.send(command);
            this.logger.log(`File deleted successfully: ${key}`);
        } catch (error) {
            this.logger.error(`Failed to delete file ${key}:`, error);
            throw error;
        }
    }

    /**
     * Delete multiple files at once
     */
    async deleteFiles(keys: string[]): Promise<void> {
        try {
            const deletePromises = keys.map((key) => this.deleteFile(key));
            await Promise.all(deletePromises);
            this.logger.log(`Deleted ${keys.length} files successfully`);
        } catch (error) {
            this.logger.error('Failed to delete multiple files:', error);
            throw error;
        }
    }

    /**
     * Get file metadata without downloading the file
     */
    async getFileMetadata(key: string): Promise<FileMetadata> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.awsConfiguration.awsBucketName,
                Key: key,
            });

            const response = await this.s3Client.send(command);

            return {
                size: response.ContentLength || 0,
                contentType: response.ContentType || 'application/octet-stream',
                lastModified: response.LastModified || new Date(),
                etag: response.ETag || '',
                metadata: response.Metadata,
            };
        } catch (error) {
            this.logger.error(`Failed to get file metadata ${key}:`, error);
            throw error;
        }
    }

    /**
     * Generate signed URL for temporary access
     */
    async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.awsConfiguration.awsBucketName,
                Key: key,
            });

            const signedUrl = await getSignedUrl(this.s3Client, command, {
                expiresIn,
            });
            this.logger.log(
                `Generated signed URL for ${key} (expires in ${expiresIn}s)`,
            );

            return signedUrl;
        } catch (error) {
            this.logger.error(
                `Failed to generate signed URL for ${key}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(key: string): Promise<boolean> {
        try {
            await this.getFileMetadata(key);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate unique key for file
     */
    generateKey(
        type: 'images' | 'documents' | 'avatars' | 'temp',
        filename: string,
    ): string {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const basePath = this.awsConfiguration.uploadPath[type];

        // Clean filename
        const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

        return `${basePath}/${timestamp}-${randomSuffix}-${cleanFilename}`;
    }

    /**
     * Get CloudFront URL
     */
    getCloudFrontUrl(key: string): string {
        return this.awsConfiguration.awsCloudfrontUrl
            ? `${this.awsConfiguration.awsCloudfrontUrl}/${key}`
            : this.generateS3Url(key);
    }

    /**
     * Generate direct S3 URL
     */
    private generateS3Url(key: string): string {
        return `https://${this.awsConfiguration.awsBucketName}.s3.${this.awsConfiguration.awsRegion}.amazonaws.com/${key}`;
    }

    /**
     * Validate file before upload
     */
    private validateFile(file: Buffer, contentType: string): void {
        // Check file size
        if (file.length > this.maxFileSize) {
            throw new BadRequestException(
                `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
            );
        }

        // Check content type
        if (!this.allowedMimeTypes.includes(contentType)) {
            throw new BadRequestException(
                `File type ${contentType} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
            );
        }

        // Check if file is empty
        if (file.length === 0) {
            throw new BadRequestException('File is empty');
        }
    }

    /**
     * Get file size without downloading
     */
    async getFileSize(key: string): Promise<number> {
        const metadata = await this.getFileMetadata(key);
        return metadata.size;
    }

    /**
     * Copy file within the same bucket
     */
    async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
        try {
            const copySource = `${this.awsConfiguration.awsBucketName}/${sourceKey}`;

            const command = new CopyObjectCommand({
                Bucket: this.awsConfiguration.awsBucketName,
                Key: destinationKey,
                CopySource: copySource,
            });

            await this.s3Client.send(command);
            this.logger.log(
                `File copied successfully: ${sourceKey} -> ${destinationKey}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to copy file ${sourceKey} to ${destinationKey}:`,
                error,
            );
            throw error;
        }
    }
}
