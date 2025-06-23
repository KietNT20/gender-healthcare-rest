import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
    IsInt,
    IsUUID,
} from 'class-validator';
import { ContentStatusType } from 'src/enums';

export class CreateBlogDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    slug: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsUUID()
    authorId?: string;

    @IsEnum(ContentStatusType)
    status: ContentStatusType;

    @IsOptional()
    @IsString()
    featuredImage?: string;

    @ApiProperty()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsInt()
    views?: number;

    @IsOptional()
    @IsString()
    seoTitle?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    seoDescription?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    relatedServicesIds?: string[];

    @IsOptional()
    @IsString()
    excerpt?: string;

    @IsOptional()
    @IsInt()
    readTime?: number;

    @IsOptional()
    @IsUUID()
    reviewedById?: string;

    @IsOptional()
    @IsString()
    rejectionReason?: string;

    @IsOptional()
    @IsString()
    revisionNotes?: string;

    @IsOptional()
    @IsUUID()
    publishedById?: string;

    @IsOptional()
    @IsUUID()
    categoryId?: string;
}
