import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
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

    @ApiProperty({
        enum: ContentStatusType,
        default: ContentStatusType.DRAFT,
    })
    @IsEnum(ContentStatusType)
    status: ContentStatusType = ContentStatusType.DRAFT;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    featuredImage?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    views?: number = 0;

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
    @IsUUID('4', { each: true })
    relatedServices?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    excerpt?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsUUID('4')
    categoryId: string;

    @ApiPropertyOptional({
        description:
            'Auto publish for Admin/Manager (bypasses review workflow)',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    autoPublish?: boolean = false;
}
