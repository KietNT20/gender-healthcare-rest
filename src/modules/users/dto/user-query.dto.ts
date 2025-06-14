import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { SortOrder } from 'src/enums';

export class GetUserQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    roleId?: string;

    @ApiPropertyOptional({
        description: 'Filter by active status',
        default: true,
        type: 'boolean',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;

    @ApiPropertyOptional({
        enum: ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt'],
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

export class UserQueryDto extends IntersectionType(
    GetUserQueryDto,
    PaginationDto,
) {}
