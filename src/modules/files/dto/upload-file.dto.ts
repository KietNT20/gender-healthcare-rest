import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadImageDto {
    @ApiPropertyOptional({
        description: 'Alternative text for the image',
        example: 'User profile picture',
    })
    @IsOptional()
    @IsString()
    altText?: string;

    @ApiPropertyOptional({
        description: 'Entity type this image belongs to',
        example: 'user_profile',
    })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({
        description: 'Entity ID this image belongs to',
        example: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    entityId?: string;

    @ApiPropertyOptional({
        description: 'Whether to generate thumbnails',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    generateThumbnails?: boolean = true;

    @ApiPropertyOptional({
        description: 'Whether this image is public',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isPublic?: boolean = true;
}

export class UploadDocumentDto {
    @ApiPropertyOptional({
        description: 'Document name/title',
        example: 'Medical Report',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Document description',
        example: 'Blood test results from lab',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Document type/category',
        example: 'medical_report',
    })
    @IsOptional()
    @IsString()
    documentType?: string;

    @ApiPropertyOptional({
        description: 'Entity type this document belongs to',
        example: 'appointment',
    })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({
        description: 'Entity ID this document belongs to',
        example: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    entityId?: string;

    @ApiPropertyOptional({
        description: 'Whether this document is public',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isPublic?: boolean = false;

    @ApiPropertyOptional({
        description: 'Whether this document contains sensitive information',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isSensitive?: boolean = false;
}

export class FileUploadResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    url: string;

    @ApiProperty()
    cloudFrontUrl: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    originalName: string;

    @ApiProperty()
    mimeType: string;

    @ApiProperty()
    size: number;

    @ApiProperty()
    key: string;

    @ApiProperty({ required: false })
    thumbnails?: {
        small: string;
        medium: string;
        large: string;
    };
}

export class BulkUploadDto {
    @ApiPropertyOptional({
        description: 'Entity type for all files',
        example: 'appointment',
    })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({
        description: 'Entity ID for all files',
        example: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    entityId?: string;

    @ApiPropertyOptional({
        description: 'Whether all files are public',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isPublic?: boolean = false;
}
