import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { SortOrder } from 'src/enums';

export class GetCycleMoodQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by cycle ID',
        type: String,
        format: 'uuid',
    })
    @IsUUID('4')
    @IsOptional()
    cycleId?: string;

    @ApiPropertyOptional({
        description: 'Filter by mood ID',
        type: String,
        format: 'uuid',
    })
    @IsUUID('4')
    @IsOptional()
    moodId?: string;

    @ApiPropertyOptional({
        description: 'Filter by intensity level',
        type: Number,
    })
    @IsNumber()
    @IsOptional()
    intensity?: number;

    @ApiPropertyOptional({
        enum: SortOrder,
        default: SortOrder.ASC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;

    @ApiPropertyOptional({
        description: 'Sort by field',
        enum: ['createdAt', 'updatedAt', 'intensity', 'moodId', 'cycleId'],
        default: 'createdAt',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';
}

export class CycleMoodQueryDto extends IntersectionType(
    GetCycleMoodQueryDto,
    PaginationDto,
) {}
