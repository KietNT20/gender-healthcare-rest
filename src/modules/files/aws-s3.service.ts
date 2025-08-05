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
    NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { THIRTY_DAYS } from 'src/constant';
import awsConfig from './config/aws.config';
import { UploadResult } from './interfaces';

export interface FileMetadata {
    size: number;
    contentType: string;
    lastModified: Date;
    etag: string;
    metadata?: Record<string, string>;
    bucket: string;
    isPublic: boolean;
}

export interface UploadOptions {
    metadata?: Record<string, string>;
    expires?: number;
    forcePublic?: boolean; // Override to force public bucket
    forcePrivate?: boolean; // Override to force private bucket
}

type FileType = 'images' | 'documents' | 'avatars' | 'temp';

interface BucketConfig {
    name: string;
    cloudfrontUrl?: string;
    isPublic: boolean;
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
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    constructor(
        @Inject(awsConfig.KEY)
        private readonly awsConfiguration: ConfigType<typeof awsConfig>,
    ) {
        this.s3Client = new S3Client({
            region: this.awsConfiguration.awsRegion,
            credentials: {
                accessKeyId: this.awsConfiguration.credentials
                    .accessKeyId as string,
                secretAccessKey: this.awsConfiguration.credentials
                    .secretAccessKey as string,
            },
            // Optimize for production performance
            requestHandler: {
                requestTimeout: 30000, // 30s timeout for individual requests
                connectionTimeout: 5000, // 5s connection timeout
            },
            maxAttempts: 3, // Retry failed requests up to 3 times
        });
    }

    /**
     * Get bucket configuration based on file type and options
     */
    private getBucketConfig(
        key: string,
        options: UploadOptions = {},
    ): BucketConfig {
        const fileType = this.getFileTypeFromKey(key);

        // Force public bucket (override)
        if (options.forcePublic) {
            return {
                name: this.awsConfiguration.publicBucket.name as string,
                cloudfrontUrl: this.awsConfiguration.publicBucket.cloudfrontUrl,
                isPublic: true,
            };
        }

        // Force private bucket (override) OR documents are always private
        if (
            options.forcePrivate ||
            fileType === 'documents' ||
            fileType === 'temp'
        ) {
            return {
                name: this.awsConfiguration.privateBucket.name as string,
                cloudfrontUrl:
                    this.awsConfiguration.privateBucket.cloudfrontUrl,
                isPublic: false,
            };
        }

        // Default: public bucket for images and avatars
        return {
            name: this.awsConfiguration.publicBucket.name as string,
            cloudfrontUrl: this.awsConfiguration.publicBucket.cloudfrontUrl,
            isPublic: true,
        };
    }

    /**
     * Determine file type from key
     */
    private getFileTypeFromKey(key: string): FileType {
        if (key.startsWith('images/')) return 'images';
        if (key.startsWith('avatars/')) return 'avatars';
        if (key.startsWith('documents/')) return 'documents';
        if (key.startsWith('temp/')) return 'temp';

        // Default to temp for unknown paths
        return 'temp';
    }

    /**
     * Get max file size based on file type
     */
    private getMaxFileSize(fileType: FileType): number {
        switch (fileType) {
            case 'images':
            case 'avatars':
                return this.awsConfiguration.maxFileSize.image;
            case 'documents':
                return this.awsConfiguration.maxFileSize.document;
            case 'temp':
                return this.awsConfiguration.maxFileSize.temp;
            default:
                return this.awsConfiguration.maxFileSize.temp;
        }
    }

    /**
     * Upload file to appropriate S3 bucket with validation
     * isPublic parameter in metadata will determine bucket choice
     */
    async uploadFile(
        file: Buffer,
        key: string,
        contentType: string,
        options: UploadOptions = {},
    ): Promise<UploadResult> {
        const fileType = this.getFileTypeFromKey(key);

        let shouldBePrivate: boolean;

        if (
            options.forcePublic !== undefined ||
            options.forcePrivate !== undefined
        ) {
            // Respect explicit force flags
            shouldBePrivate = options.forcePrivate || !options.forcePublic;
        } else {
            // Auto-detect based on metadata and file type
            const isPublicRequest = options.metadata?.isPublic === 'true';
            shouldBePrivate =
                !isPublicRequest ||
                fileType === 'documents' ||
                fileType === 'temp';
        }

        const bucketOptions: UploadOptions = {
            ...options,
            forcePublic: !shouldBePrivate,
            forcePrivate: shouldBePrivate,
        };

        const bucketConfig = this.getBucketConfig(key, bucketOptions);

        // Validate file
        this.validateFile(file, contentType, fileType);

        try {
            const command = new PutObjectCommand({
                Bucket: bucketConfig.name,
                Key: key,
                Body: file,
                ContentType: contentType,
                Metadata: options.metadata,
                Expires: options.expires
                    ? new Date(Date.now() + options.expires * 1000)
                    : undefined,
            });

            const response = await this.s3Client.send(command);

            const url = this.generateS3Url(key, bucketConfig);
            const cloudFrontUrl = this.getCloudFrontUrl(key, bucketConfig);

            this.logger.log(
                `File uploaded successfully to ${bucketConfig.isPublic ? 'public' : 'private'} bucket: ${key} (${file.length} bytes)`,
            );

            return {
                key,
                url,
                cloudFrontUrl,
                bucket: bucketConfig.name,
                size: file.length,
                contentType,
                etag: response.ETag,
                isPublic: bucketConfig.isPublic,
            };
        } catch (error) {
            this.logger.error(`Failed to upload file ${key}:`, error);
            throw error;
        }
    }

    /**
     * Upload file with explicit public/private choice
     */
    async uploadFileWithPrivacy(
        file: Buffer,
        key: string,
        contentType: string,
        isPublic: boolean,
        options: UploadOptions = {},
    ): Promise<UploadResult> {
        return this.uploadFile(file, key, contentType, {
            ...options,
            forcePublic: isPublic,
            forcePrivate: !isPublic,
            metadata: {
                ...options.metadata,
                isPublic: isPublic ? 'true' : 'false',
            },
        });
    }

    /**
     * Download file from appropriate S3 bucket
     */
    async downloadFile(key: string): Promise<Buffer> {
        // Try both buckets to find the file
        const buckets = [
            this.getBucketConfig(key, { forcePublic: true }),
            this.getBucketConfig(key, { forcePrivate: true }),
        ];

        for (const bucketConfig of buckets) {
            try {
                const command = new GetObjectCommand({
                    Bucket: bucketConfig.name,
                    Key: key,
                });

                const response = await this.s3Client.send(command);

                if (!response.Body) {
                    continue; // Try next bucket
                }

                const chunks: Uint8Array[] = [];
                const stream = response.Body as ReadableStream<Uint8Array>;

                for await (const chunk of stream) {
                    chunks.push(chunk);
                }

                const buffer = Buffer.concat(chunks);
                this.logger.log(
                    `File downloaded successfully from ${bucketConfig.isPublic ? 'public' : 'private'} bucket: ${key} (${buffer.length} bytes)`,
                );

                return buffer;
            } catch {
                // Continue to next bucket if file not found
                this.logger.warn(
                    `File not found in bucket ${bucketConfig.name} for key: ${key}`,
                );
                continue;
            }
        }

        // If not found in any bucket
        this.logger.error(`File not found in any bucket: ${key}`);
        throw new NotFoundException(`File not found: ${key}`);
    }

    /**
     * Delete file from appropriate S3 bucket
     */
    async deleteFile(key: string): Promise<void> {
        // Try both buckets to delete the file
        const buckets = [
            this.getBucketConfig(key, { forcePublic: true }),
            this.getBucketConfig(key, { forcePrivate: true }),
        ];

        let deleted = false;

        for (const bucketConfig of buckets) {
            try {
                const command = new DeleteObjectCommand({
                    Bucket: bucketConfig.name,
                    Key: key,
                });

                await this.s3Client.send(command);
                this.logger.log(
                    `File deleted successfully from ${bucketConfig.isPublic ? 'public' : 'private'} bucket: ${key}`,
                );
                deleted = true;
                break; // Stop after successful deletion
            } catch {
                // Continue to next bucket
                this.logger.warn(
                    `File not found in bucket ${bucketConfig.name} for deletion: ${key}`,
                );
                continue;
            }
        }

        if (!deleted) {
            this.logger.error(`Failed to delete file from any bucket: ${key}`);
            throw new NotFoundException(`File not found for deletion: ${key}`);
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
        // Try both buckets to find the file metadata
        const buckets = [
            this.getBucketConfig(key, { forcePublic: true }),
            this.getBucketConfig(key, { forcePrivate: true }),
        ];

        for (const bucketConfig of buckets) {
            try {
                const command = new HeadObjectCommand({
                    Bucket: bucketConfig.name,
                    Key: key,
                });

                const response = await this.s3Client.send(command);

                return {
                    size: response.ContentLength || 0,
                    contentType:
                        response.ContentType || 'application/octet-stream',
                    lastModified: response.LastModified || new Date(),
                    etag: response.ETag || '',
                    metadata: response.Metadata,
                    bucket: bucketConfig.name,
                    isPublic: bucketConfig.isPublic,
                };
            } catch {
                // Continue to next bucket
                this.logger.warn(
                    `File metadata not found in bucket ${bucketConfig.name} for key: ${key}`,
                );
                continue;
            }
        }

        // If not found in any bucket
        this.logger.error(`File metadata not found in any bucket: ${key}`);
        throw new NotFoundException(`File not found: ${key}`);
    }

    /**
     * Generate signed URL for temporary access (mainly for private files)
     */
    async getSignedUrl(
        key: string,
        expiresIn: number = THIRTY_DAYS,
    ): Promise<string> {
        // First check if file is in public bucket
        try {
            const publicBucket = this.getBucketConfig(key, {
                forcePublic: true,
            });
            const command = new HeadObjectCommand({
                Bucket: publicBucket.name,
                Key: key,
            });

            await this.s3Client.send(command);

            // File exists in public bucket, return direct URL
            this.logger.log(`Returning public URL for ${key}`);
            return this.getCloudFrontUrl(key, publicBucket);
        } catch {
            // File not in public bucket, try private bucket with signed URL
            this.logger.log(
                `File not found in public bucket, generating signed URL for ${key}`,
            );
        }

        try {
            const privateBucket = this.getBucketConfig(key, {
                forcePrivate: true,
            });
            const command = new GetObjectCommand({
                Bucket: privateBucket.name,
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
        } catch {
            return false;
        }
    }

    /**
     * Generate unique key for file
     */
    generateKey(type: FileType, filename: string): string {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const basePath = this.awsConfiguration.uploadPath[type];

        // Clean filename
        const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

        return `${basePath}/${timestamp}-${randomSuffix}-${cleanFilename}`;
    }

    /**
     * Get CloudFront URL for a file
     */
    getCloudFrontUrl(key: string, bucketConfig?: BucketConfig): string {
        if (!bucketConfig) {
            // Default to public bucket if not specified
            bucketConfig = this.getBucketConfig(key, { forcePublic: true });
        }

        return bucketConfig.cloudfrontUrl
            ? `${bucketConfig.cloudfrontUrl}/${key}`
            : this.generateS3Url(key, bucketConfig);
    }

    /**
     * Generate direct S3 URL
     */
    private generateS3Url(key: string, bucketConfig: BucketConfig): string {
        return `https://${bucketConfig.name}.s3.${this.awsConfiguration.awsRegion}.amazonaws.com/${key}`;
    }

    /**
     * Validate file before upload
     */
    private validateFile(
        file: Buffer,
        contentType: string,
        fileType: FileType,
    ): void {
        const maxSize = this.getMaxFileSize(fileType);

        // Check file size
        if (file.length > maxSize) {
            throw new BadRequestException(
                `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB for ${fileType}`,
            );
        }

        // Check content type
        if (!this.allowedMimeTypes.includes(contentType)) {
            throw new BadRequestException(
                `File type ${contentType} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
            );
        }

        // Additional validation for file types
        if (
            (fileType === 'images' || fileType === 'avatars') &&
            !this.awsConfiguration.allowedImageTypes.includes(contentType)
        ) {
            throw new BadRequestException(
                `Invalid image type ${contentType}. Allowed: ${this.awsConfiguration.allowedImageTypes.join(', ')}`,
            );
        }

        if (
            fileType === 'documents' &&
            !this.awsConfiguration.allowedDocumentTypes.includes(contentType)
        ) {
            throw new BadRequestException(
                `Invalid document type ${contentType}. Allowed: ${this.awsConfiguration.allowedDocumentTypes.join(', ')}`,
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
     * Copy file within the same bucket or across buckets
     */
    async copyFile(
        sourceKey: string,
        destinationKey: string,
        isPublic?: boolean,
    ): Promise<void> {
        try {
            // Get source file metadata to determine which bucket it's in
            const sourceMetadata = await this.getFileMetadata(sourceKey);
            const sourceBucket = sourceMetadata.bucket;

            // Determine destination bucket
            const destBucketConfig =
                isPublic !== undefined
                    ? this.getBucketConfig(destinationKey, {
                          forcePublic: isPublic,
                          forcePrivate: !isPublic,
                      })
                    : this.getBucketConfig(destinationKey);

            const copySource = `${sourceBucket}/${sourceKey}`;

            const command = new CopyObjectCommand({
                Bucket: destBucketConfig.name,
                Key: destinationKey,
                CopySource: copySource,
            });

            await this.s3Client.send(command);
            this.logger.log(
                `File copied successfully: ${sourceKey} -> ${destinationKey} (${sourceBucket} -> ${destBucketConfig.name})`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to copy file ${sourceKey} to ${destinationKey}:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Get public URL for public files, signed URL for private files
     */
    async getAccessUrl(
        key: string,
        expiresIn: number = THIRTY_DAYS,
    ): Promise<string> {
        return this.getSignedUrl(key, expiresIn);
    }
}
