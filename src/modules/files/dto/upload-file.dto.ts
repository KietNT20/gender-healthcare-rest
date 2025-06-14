import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsBooleanString,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class UploadImageDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Image file to upload',
    })
    file: Express.Multer.File;

    @ApiProperty({
        description: 'Type of entity (e.g., "user", "blog", "service")',
        example: 'user',
    })
    @IsNotEmpty({ message: 'Entity type is required' })
    @IsString()
    entityType: string;

    @ApiProperty({
        description: 'ID of the entity this image belongs to',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'Entity ID is required' })
    @IsUUID(4, { message: 'Entity ID must be a valid UUID' })
    entityId: string;

    @ApiPropertyOptional({
        description: 'Alternative text for accessibility',
        example: 'User profile picture',
    })
    @IsOptional()
    @IsString()
    altText?: string;

    @ApiPropertyOptional({
        description: 'Generate thumbnails for this image',
        default: 'true',
        enum: ['true', 'false'],
    })
    @IsOptional()
    @IsBooleanString()
    generateThumbnails?: boolean = true;

    @ApiPropertyOptional({
        description: 'Make image publicly accessible',
        default: 'true',
        enum: ['true', 'false'],
    })
    @IsOptional()
    @IsBooleanString()
    isPublic?: boolean = true;
}

export class UploadDocumentDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Document file to upload',
    })
    file: Express.Multer.File;

    @ApiProperty({
        description: 'Type of entity (e.g., "contract", "user", "service")',
        example: 'contract',
    })
    @IsNotEmpty({ message: 'Entity type is required' })
    @IsString()
    entityType: string;

    @ApiProperty({
        description: 'ID of the entity this document belongs to',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'Entity ID is required' })
    @IsUUID(4, { message: 'Entity ID must be a valid UUID' })
    entityId: string;

    @ApiPropertyOptional({
        description: 'Custom name for the document',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Description of the document',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Type of document (e.g., "contract", "invoice", "report")',
    })
    @IsOptional()
    @IsString()
    documentType?: string;

    @ApiPropertyOptional({
        description: 'Make document publicly accessible',
        default: false,
    })
    @IsOptional()
    @IsBooleanString()
    isPublic?: boolean = false;

    @ApiPropertyOptional({
        description: 'Mark document as containing sensitive information',
        default: false,
    })
    @IsOptional()
    @IsBooleanString()
    isSensitive?: boolean = false;
}

export class BulkUploadDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    entityId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPublic?: boolean = false;
}

export class TestUploadDto {
    @ApiPropertyOptional({
        description: 'Test description',
        example: 'Test upload to AWS S3',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Make file publicly accessible',
        default: 'true',
        enum: ['true', 'false'],
    })
    @IsOptional()
    @IsBooleanString()
    isPublic?: string = 'true';
}
