import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsIn, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { SortOrder } from 'src/enums';
import { ContentStatusType } from 'src/enums';

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
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({
        description: 'Filter by active status',
        default: true,
        type: 'boolean',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;

    @ApiPropertyOptional({
        enum: ['createdAt', 'updatedAt', 'views', 'title'],
        default: 'createdAt',
    })
    @IsOptional()
    @IsString()
    @IsIn(['createdAt', 'updatedAt', 'views', 'title'], {
        message: 'sortBy must be one of: createdAt, updatedAt, views, title',
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