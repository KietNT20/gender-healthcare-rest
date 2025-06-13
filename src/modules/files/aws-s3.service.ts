import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import awsConfig from './config/aws.config';

export interface UploadResult {
    key: string;
    url: string;
    cloudFrontUrl: string;
    bucket: string;
    size: number;
}

@Injectable()
export class AwsS3Service {
    private readonly logger = new Logger(AwsS3Service.name);
    private readonly s3Client: S3Client;

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

    async uploadFile(
        file: Buffer,
        key: string,
        contentType: string,
        metadata?: Record<string, string>,
    ): Promise<UploadResult> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.awsConfiguration.awsBucketName,
                Key: key,
                Body: file,
                ContentType: contentType,
                Metadata: metadata,
                // Make public readable
                ACL: 'public-read',
            });

            await this.s3Client.send(command);

            const url = `https://${this.awsConfiguration.awsBucketName}.s3.${this.awsConfiguration.awsRegion}.amazonaws.com/${key}`;
            const cloudFrontUrl = this.awsConfiguration.awsCloudfrontUrl
                ? `${this.awsConfiguration.awsCloudfrontUrl}/${key}`
                : url;

            this.logger.log(`File uploaded successfully: ${key}`);

            return {
                key,
                url,
                cloudFrontUrl,
                bucket: this.awsConfiguration.awsBucketName as string,
                size: file.length,
            };
        } catch (error) {
            this.logger.error(`Failed to upload file ${key}:`, error);
            throw error;
        }
    }

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

    async getFile(key: string): Promise<Buffer> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.awsConfiguration.awsBucketName,
                Key: key,
            });

            const response = await this.s3Client.send(command);

            if (!response.Body) {
                throw new Error('File body is empty');
            }

            // Convert stream to buffer
            const chunks: Uint8Array[] = [];
            const stream = response.Body as any;

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            return Buffer.concat(chunks);
        } catch (error) {
            this.logger.error(`Failed to get file ${key}:`, error);
            throw error;
        }
    }

    async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.awsConfiguration.awsBucketName,
                Key: key,
            });

            return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
            this.logger.error(
                `Failed to generate signed URL for ${key}:`,
                error,
            );
            throw error;
        }
    }

    async fileExists(key: string): Promise<boolean> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.awsConfiguration.awsBucketName,
                Key: key,
            });

            await this.s3Client.send(command);
            return true;
        } catch (error) {
            return false;
        }
    }

    generateKey(
        type: 'images' | 'documents' | 'avatars' | 'temp',
        filename: string,
        userId?: string,
    ): string {
        const timestamp = Date.now();
        const basePath = this.awsConfiguration.uploadPath[type];

        if (userId) {
            return `${basePath}/${userId}/${timestamp}-${filename}`;
        }

        return `${basePath}/${timestamp}-${filename}`;
    }

    getCloudFrontUrl(key: string): string {
        return this.awsConfiguration.awsCloudfrontUrl
            ? `${this.awsConfiguration.awsCloudfrontUrl}/${key}`
            : `https://${this.awsConfiguration.awsBucketName}.s3.${this.awsConfiguration.awsRegion}.amazonaws.com/${key}`;
    }
}
