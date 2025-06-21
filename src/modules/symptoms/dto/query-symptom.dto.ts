import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { SortOrder } from 'src/enums';

export class GetSymptomQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        enum: ['name', 'createdAt', 'updatedAt'],
        default: 'createdAt',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        enum: SortOrder,
        default: SortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;
}

export class SymptomQueryDto extends IntersectionType(
    GetSymptomQueryDto,
    PaginationDto,
) {}
