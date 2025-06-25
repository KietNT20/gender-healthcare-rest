import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsBooleanString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { LocationTypeEnum, SortOrder } from 'src/enums';

class Filters {
    @ApiPropertyOptional({
        description: 'Filter by consultant ID (Admin/Manager)',
    })
    @IsOptional()
    @IsUUID('4')
    consultantId?: string;

    @ApiPropertyOptional({ description: 'Filter by day of the week (0-6)' })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek?: number;

    @ApiPropertyOptional({
        description: 'Filter by availability status',
        type: 'boolean',
    })
    @IsOptional()
    @IsBooleanString()
    isAvailable?: string = 'true';

    @ApiPropertyOptional({
        description: 'Filter by location',
        enum: LocationTypeEnum,
    })
    @IsOptional()
    @IsEnum(LocationTypeEnum)
    location?: LocationTypeEnum;
}

class Sorting {
    @ApiPropertyOptional({
        description: 'Sort by field',
        enum: ['dayOfWeek', 'startTime', 'createdAt'],
        default: 'dayOfWeek',
    })
    @IsOptional()
    @IsString()
    sortBy: string = 'dayOfWeek';

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: SortOrder,
        default: SortOrder.ASC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder: SortOrder = SortOrder.ASC;
}

export class FiltersAndSorting extends IntersectionType(Filters, Sorting) {}

export class QueryConsultantAvailabilityDto extends IntersectionType(
    PaginationDto,
    FiltersAndSorting,
) {}
