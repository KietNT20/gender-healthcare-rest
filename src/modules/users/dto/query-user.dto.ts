import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsBooleanString,
    IsEnum,
    IsIn,
    IsOptional,
    IsString,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { SortOrder } from 'src/enums';

export class GetUserQueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    roleId?: string;

    @ApiPropertyOptional({
        description: 'Filter by active status',
        type: 'boolean',
    })
    @IsOptional()
    @IsBooleanString()
    isActive?: string = 'true';

    @ApiPropertyOptional({
        enum: ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt'],
        default: 'createdAt',
    })
    @IsString()
    @IsIn(['firstName', 'lastName', 'email', 'createdAt', 'updatedAt'])
    @IsOptional()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        enum: SortOrder,
        default: SortOrder.DESC,
    })
    @IsEnum(SortOrder)
    @IsOptional()
    sortOrder?: SortOrder = SortOrder.DESC;
}

export class UserQueryDto extends IntersectionType(
    GetUserQueryDto,
    PaginationDto,
) {}
