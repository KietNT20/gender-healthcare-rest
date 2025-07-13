import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsBoolean,
    IsBooleanString,
    IsEnum,
    IsIn,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { LocationTypeEnum, SortOrder } from 'src/enums';

export class GetServiceQueryDto {
    @ApiPropertyOptional({
        description:
            'Trường sắp xếp (name, price, duration, createdAt, updatedAt)',
        enum: ['name', 'price', 'duration', 'createdAt', 'updatedAt'],
        default: 'createdAt',
    })
    @IsOptional()
    @IsString()
    @IsIn(['name', 'price', 'duration', 'createdAt', 'updatedAt'])
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        enum: SortOrder,
        description: 'Thứ tự sắp xếp, mặc định là DESC',
        default: SortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;

    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm trong tên hoặc mô tả',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'ID của danh mục dịch vụ' })
    @IsOptional()
    @IsUUID('4')
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Giá tối thiểu'})
    @IsOptional()
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Giá tối đa' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        description: 'Trạng thái hoạt động của dịch vụ',
        type: 'boolean',
    })
    @IsOptional()
    @IsBooleanString()
    isActive?: string;

    @ApiPropertyOptional({
        description: 'Dịch vụ có được đánh dấu là nổi bật hay không',
        type: 'boolean',
    })
    @IsOptional()
    @IsBooleanString()
    featured?: string;

    @ApiPropertyOptional({
        description: 'Dịch vụ có yêu cầu tư vấn viên hay không',
        type: 'boolean',
    })
    @IsOptional()
    @IsBooleanString()
    requiresConsultant?: string;


    @ApiPropertyOptional({
        description: 'Địa điểm cung cấp dịch vụ',
        enum: LocationTypeEnum,
    })
    @IsOptional()
    @IsEnum(LocationTypeEnum)
    location?: LocationTypeEnum;
}

export class ServiceQueryDto extends IntersectionType(
    GetServiceQueryDto,
    PaginationDto,
) {}