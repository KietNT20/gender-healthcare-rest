import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { SortOrder } from 'src/enums';

export class GetCycleSymptomQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by cycle ID',
        type: String,
        format: 'uuid',
    })
    @IsUUID('4')
    @IsOptional()
    cycleId?: string;

    @ApiPropertyOptional({
        description: 'Filter by symptom ID',
        type: String,
        format: 'uuid',
    })
    @IsUUID('4')
    @IsOptional()
    symptomId?: string;

    @ApiPropertyOptional({
        description: 'Filter by intensity level',
        type: Number,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(5)
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
        enum: ['createdAt', 'updatedAt', 'intensity', 'symptomId', 'cycleId'],
        default: 'createdAt',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';
}

export class CycleSymptomQueryDto extends IntersectionType(
    PaginationDto,
    GetCycleSymptomQueryDto,
) {}
