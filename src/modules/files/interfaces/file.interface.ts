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
