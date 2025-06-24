import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { ContentStatusType } from 'src/enums';

export class CreateBlogDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID('4')
    authorId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty()
    @IsEnum(ContentStatusType)
    status: ContentStatusType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    featuredImage?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    views?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    seoTitle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    seoDescription?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    relatedServicesIds?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    excerpt?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    readTime?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID('4')
    reviewedById?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    rejectionReason?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    revisionNotes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID('4')
    publishedById?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID('4')
    categoryId: string;
}
