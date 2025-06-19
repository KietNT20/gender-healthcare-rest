import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    Allow,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class UploadImageMetadataDto {
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
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    generateThumbnails: boolean = true;

    @ApiPropertyOptional({
        description: 'Make image publicly accessible',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isPublic: boolean = true;
}

export class UploadImageDto extends UploadImageMetadataDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Image file to upload',
    })
    file: Express.Multer.File;
}

export class UploadDocumentMetadataDto {
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
        description: 'Mark document as containing sensitive information',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isSensitive: boolean = false;
}

export class UploadDocumentDto extends UploadDocumentMetadataDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Document file to upload',
    })
    file: Express.Multer.File;
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

    @ApiPropertyOptional({
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isPublic: boolean = false;
}

export class TestUploadDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
    })
    @Allow()
    file: Express.Multer.File;

    @ApiPropertyOptional({
        description: 'Test description',
        example: 'Test upload to AWS S3',
        default: 'Test upload to AWS S3',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value || 'Test upload to AWS S3')
    description: string = 'Test upload to AWS S3';

    @ApiPropertyOptional({
        description: 'Make file publicly accessible',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isPublic: boolean = true;
}
