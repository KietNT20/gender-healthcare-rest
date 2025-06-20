import { StorageClass } from '@aws-sdk/client-s3';
import { Image } from 'src/modules/images/entities/image.entity';

export interface UploadFileOptions {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    folder?: string;
    isPublic?: boolean;
    metadata?: Record<string, string>;
    storageClass?: StorageClass;
}

export interface UploadResult {
    key: string;
    url: string;
    cloudFrontUrl: string;
    bucket: string;
    size: number;
    contentType: string;
    etag?: string;
}

export interface FileUploadDto {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
    description?: string;
    documentType?: string;
    entityType?: string;
    entityId?: string;
    isPublic?: boolean;
    isSensitive?: boolean;
}

export interface FileResult {
    id: string;
    url: string;
    originalName: string;
    size: number;
    status?: 'pending' | 'processing' | 'completed' | 'failed'; // Added status tracking
    metadata?: Record<string, any>; // Added metadata support
}

// Enhanced file metadata interface
export interface EnhancedFileMetadata {
    size: number;
    contentType: string;
    lastModified: Date;
    etag: string;
    metadata?: Record<string, string>;
    s3Key: string;
    cloudFrontUrl: string;
    processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    variants?: {
        thumbnails?: Record<string, ThumbnailInfo>;
        customSizes?: CustomSizeInfo[];
    };
}

export interface ThumbnailInfo {
    key: string;
    url: string;
    cloudFrontUrl: string;
    width: number;
    height: number;
    size: number;
}

export interface CustomSizeInfo {
    name: string;
    key: string;
    url: string;
    cloudFrontUrl: string;
    width: number;
    height: number;
    size: number;
}

// Batch operation interfaces
export interface BatchDeleteOptions {
    imageIds?: string[];
    documentIds?: string[];
    s3Keys?: string[];
}

export interface BatchDeleteResult {
    deleted: number;
    failed: number;
    errors: string[];
}

// File search and filtering interfaces
export interface FileSearchOptions {
    entityType?: string;
    entityId?: string;
    mimeType?: string;
    minSize?: number;
    maxSize?: number;
    createdAfter?: Date;
    createdBefore?: Date;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    tags?: string[];
    limit?: number;
    offset?: number;
}

export interface FileSearchResult {
    files: (Image | Document)[];
    total: number;
    hasMore: boolean;
}

// Processing status tracking
export interface ProcessingStatus {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    processingTime?: number;
}

// File analytics interface
export interface FileAnalytics {
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    uploadTrend: Array<{
        date: string;
        count: number;
        size: number;
    }>;
    processingStats: {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        averageProcessingTime: number;
    };
}

// S3 configuration interface
export interface S3Config {
    bucket: string;
    region: string;
    cloudFrontUrl?: string;
    uploadPath: {
        images: string;
        documents: string;
        avatars: string;
        temp: string;
        'custom-images': string;
    };
    maxFileSize: {
        image: number;
        document: number;
    };
    allowedMimeTypes: {
        images: string[];
        documents: string[];
    };
    defaultStorageClass?: StorageClass;
    lifecycleRules?: Array<{
        id: string;
        prefix: string;
        transitions: Array<{
            days: number;
            storageClass: StorageClass;
        }>;
    }>;
}

// Validation result interface
export interface FileValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fileInfo: {
        detectedMimeType?: string;
        actualSize: number;
        hasValidHeader: boolean;
    };
}

export interface CustomImageSize {
    name: string;
    width: number;
    height: number;
    resizeMode: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    cropPosition?:
        | 'center'
        | 'top'
        | 'bottom'
        | 'left'
        | 'right'
        | 'entropy'
        | 'attention';
    quality?: number; // Optional quality override
}

export interface UploadImageOptions {
    file: Express.Multer.File;
    entityType?: string;
    entityId?: string;
    altText?: string;
    isPublic?: boolean;
    generateThumbnails?: boolean;
    customSizes?: CustomImageSize[];
    aspectRatio?: {
        width: number;
        height: number;
        enforceExact?: boolean;
    };
}

export interface UploadDocumentOptions {
    file: Express.Multer.File;
    entityType: string;
    entityId: string;
    description?: string;
    isSensitive?: boolean;
    tags?: string[];
    category?: string;
    documentType?: string;
}

export interface FileResult {
    id: string;
    url: string;
    originalName: string;
    size: number;
}
