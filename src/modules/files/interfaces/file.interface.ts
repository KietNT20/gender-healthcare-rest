export interface UploadFileOptions {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    folder?: string;
    isPublic?: boolean;
}

export interface UploadResult {
    key: string;
    url: string;
    size: number;
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

export interface UploadImageOptions {
    file: Express.Multer.File;
    entityType: string;
    entityId: string;
    altText?: string;
    isPublic?: boolean;
    generateThumbnails?: boolean;
}

export interface UploadDocumentOptions {
    file: Express.Multer.File;
    entityType: string;
    entityId: string;
    description?: string;
    isPublic?: boolean;
    isSensitive?: boolean;
}

export interface FileResult {
    id: string;
    url: string;
    originalName: string;
    size: number;
}