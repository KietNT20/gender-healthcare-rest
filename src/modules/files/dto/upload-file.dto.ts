import {
    ApiProperty,
    ApiPropertyOptional,
    IntersectionType,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    Allow,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { TransformEmptyStringToUndefined } from 'src/decorators/transform-null.decorator';

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
    @TransformEmptyStringToUndefined()
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

export class ImageFileUploadDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Image file to upload',
    })
    file: any;
}

export class UploadImageDto extends IntersectionType(
    ImageFileUploadDto,
    UploadImageMetadataDto,
) {}

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
    @TransformEmptyStringToUndefined()
    name?: string;

    @ApiPropertyOptional({
        description: 'Description of the document',
    })
    @IsOptional()
    @IsString()
    @TransformEmptyStringToUndefined()
    description?: string;

    @ApiPropertyOptional({
        description: 'Type of document (e.g., "contract", "invoice", "report")',
    })
    @IsOptional()
    @IsString()
    @TransformEmptyStringToUndefined()
    documentType?: string;

    @ApiProperty({
        description: 'Mark document as containing sensitive information',
        default: false,
    })
    @IsBoolean()
    isSensitive: boolean = false;
}

export class UploadDocumentDto extends UploadDocumentMetadataDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Document file to upload',
    })
    file: any;
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
    @Transform(
        ({ value }: { value: string }) => value || 'Test upload to AWS S3',
    )
    description: string = 'Test upload to AWS S3';

    @ApiPropertyOptional({
        description: 'Make file publicly accessible',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isPublic: boolean = true;
}

export class UploadPublicPdfMetadataDto {
    @ApiProperty({
        description: 'Type of entity (e.g., "blog", "service", "news")',
        example: 'blog',
    })
    @IsNotEmpty({ message: 'Entity type is required' })
    @IsString()
    entityType: string;

    @ApiProperty({
        description: 'ID of the entity this PDF belongs to',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'Entity ID is required' })
    @IsUUID('4', { message: 'Entity ID must be a valid UUID' })
    entityId: string;

    @ApiPropertyOptional({
        description: 'Description of the PDF document',
        example: 'Important healthcare guidelines',
    })
    @IsOptional()
    @IsString()
    @TransformEmptyStringToUndefined()
    description?: string;
}

export class PdfFileDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'PDF file to upload',
    })
    file: any;
}

export class UploadPublicPdfDto extends IntersectionType(
    PdfFileDto,
    UploadPublicPdfMetadataDto,
) {}
