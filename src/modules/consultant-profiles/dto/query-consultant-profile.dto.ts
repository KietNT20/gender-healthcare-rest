import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { ProfileStatusType, SortOrder } from 'src/enums';

export class FilterConsultantProfileDto {
    @ApiPropertyOptional({
        description: 'Search by consultant name',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description:
            'Lọc theo chuyên môn. Có thể truyền nhiều chuyên môn, phân cách bởi dấu phẩy (e.g., "STIs,Nutrition").',
    })
    @IsOptional()
    @IsString()
    specialties?: string;

    @ApiPropertyOptional({
        enum: ProfileStatusType,
        description: 'Filter by profile status',
    })
    @IsOptional()
    @IsEnum(ProfileStatusType)
    status?: ProfileStatusType;

    @ApiPropertyOptional({ description: 'Filter by availability' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isAvailable?: boolean;

    @ApiPropertyOptional({ description: 'Filter by minimum rating' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minRating?: number;
}

export class SortConsultantProfileDto {
    @ApiPropertyOptional({
        enum: [
            'rating',
            'consultationFee',
            'experience',
            'createdAt',
            'updatedAt',
        ],
        default: 'createdAt',
    })
    @IsOptional()
    @IsString()
    sortBy: string = 'createdAt';

    @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder: SortOrder = SortOrder.DESC;
}

export class FilterAndSortConsultantProfileDto extends IntersectionType(
    FilterConsultantProfileDto,
    SortConsultantProfileDto,
) {}

export class QueryConsultantProfileDto extends IntersectionType(
    PaginationDto,
    FilterAndSortConsultantProfileDto,
) {}
