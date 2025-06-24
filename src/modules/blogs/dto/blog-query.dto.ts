import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsArray,
    IsEnum,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { ContentStatusType, SortOrder } from 'src/enums';

export class GetBlogQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by blog title',
    })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({
        description: 'Filter by blog status',
        enum: ContentStatusType,
    })
    @IsOptional()
    @IsEnum(ContentStatusType)
    status?: ContentStatusType;

    @ApiPropertyOptional({
        description: 'Filter by category ID',
    })
    @IsOptional()
    @IsUUID('4')
    categoryId?: string;

    @ApiPropertyOptional({
        description:
            'Filter by tags (comma-separated list, e.g., health,fitness)',
        example: 'health,fitness',
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
    @ApiPropertyOptional({
        enum: ['createdAt', 'updatedAt', 'views', 'title', 'publishedAt'],
        default: 'createdAt',
    })
    @IsOptional()
    @IsString()
    @IsIn(['createdAt', 'updatedAt', 'views', 'title', 'publishedAt'], {
        message:
            'sortBy must be one of: createdAt, updatedAt, views, title, publishedAt',
    })
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        enum: SortOrder,
        default: SortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;
}

export class BlogQueryDto extends IntersectionType(
    GetBlogQueryDto,
    PaginationDto,
) {}
