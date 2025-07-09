import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsBooleanString,
    IsEnum,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { LocationTypeEnum, ProfileStatusType, SortOrder } from 'src/enums';

export class FilterConsultantProfileDto {
    @ApiPropertyOptional({
        description: 'Search by consultant name',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description:
            'Lọc theo chuyên môn. Có thể truyền nhiều chuyên môn, phân cách bởi dấu phẩy (e.g., "STIs, Nutrition").',
    })
    @IsOptional()
    @IsString()
    specialties?: string;

    @ApiPropertyOptional({
        description: 'Filter by minimum consultation fee',
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minConsultationFee?: number;

    @ApiPropertyOptional({
        description: 'Filter by maximum consultation fee',
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxConsultationFee?: number;

    @ApiPropertyOptional({
        description: 'Filter by location type',
        enum: LocationTypeEnum,
        default: LocationTypeEnum.ONLINE,
    })
    @IsOptional()
    @IsEnum(LocationTypeEnum)
    consultationTypes?: LocationTypeEnum = LocationTypeEnum.ONLINE;

    @ApiPropertyOptional({
        enum: ProfileStatusType,
        description: 'Filter by profile status',
    })
    @IsOptional()
    @IsEnum(ProfileStatusType)
    status?: ProfileStatusType;

    @ApiPropertyOptional({
        description: 'Filter by availability',
        type: 'boolean',
    })
    @IsOptional()
    @IsBooleanString()
    isAvailable?: string = 'true';

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
            'specialties',
            'consultationTypes',
            'status',
            'isAvailable',
            'createdAt',
            'updatedAt',
        ],
        default: 'createdAt',
    })
    @IsOptional()
    @IsString()
    @IsIn([
        'rating',
        'consultationFee',
        'specialties',
        'consultationTypes',
        'status',
        'isAvailable',
        'createdAt',
        'updatedAt',
    ])
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
