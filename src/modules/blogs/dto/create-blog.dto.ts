import {
    IsString,
    IsEnum,
    IsArray,
    IsInt,
    IsUUID,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
} from 'class-validator';
import { ContentStatusType } from 'src/enums';

export class CreateBlogDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsNotEmpty()
    @IsUUID()
    authorId: string; 

    @IsEnum(ContentStatusType)
    @IsNotEmpty()
    status: ContentStatusType;

    @IsOptional()
    @IsString()
    featuredImage?: string;

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

    @IsOptional()
    @IsString()
    seoDescription?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

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