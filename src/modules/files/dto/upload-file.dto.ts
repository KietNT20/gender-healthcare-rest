import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsBooleanString,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class UploadImageDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    altText?: string;

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
    @IsBooleanString()
    generateThumbnails?: boolean = true;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBooleanString()
    isPublic?: boolean = true;
}

export class UploadDocumentDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    documentType?: string;

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
    @IsBooleanString()
    isPublic?: boolean = false;

    @ApiPropertyOptional()
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
