import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { SortOrder } from 'src/enums';

class AuditLogFilters {
    @ApiPropertyOptional({ description: 'Filter by user ID' })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({
        description: 'Filter by action type (e.g., CREATE, UPDATE)',
    })
    @IsOptional()
    @IsString()
    action?: string;

    @ApiPropertyOptional({
        description: 'Filter by entity type (e.g., User, Blog)',
    })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({
        description: 'Filter by start date (ISO 8601 format)',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Filter by end date (ISO 8601 format)',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}

class AuditLogSorting {
    @ApiPropertyOptional({
        enum: ['createdAt', 'action', 'entityType', 'updatedAt'],
        default: 'createdAt',
    })
    @IsOptional()
    @IsEnum(['createdAt', 'action', 'entityType', 'updatedAt'])
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        enum: SortOrder,
        default: SortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;
}

const AuditLogFiltersAndSorting = IntersectionType(
    AuditLogFilters,
    AuditLogSorting,
);

export class QueryAuditLogDto extends IntersectionType(
    PaginationDto,
    AuditLogFiltersAndSorting,
) {}
