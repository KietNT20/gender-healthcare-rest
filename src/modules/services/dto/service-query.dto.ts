import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsIn,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';
import { LocationTypeEnum, SortOrder } from 'src/enums';

export class ServiceQueryDto {
    @ApiPropertyOptional({ description: 'Số trang', default: 1, example: 1 })
    @IsOptional()
    @IsPositive()
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số bản ghi mỗi trang',
        default: 10,
        example: 10,
    })
    @IsOptional()
    @IsPositive()
    limit?: number = 10;

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

    @ApiPropertyOptional({ description: 'Giá tối thiểu', example: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Giá tối đa', example: 1000000 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        description: 'Trạng thái hoạt động của dịch vụ',
        type: 'boolean',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Dịch vụ có được đánh dấu là nổi bật hay không',
        type: 'boolean',
    })
    @IsOptional()
    @IsBoolean()
    featured?: boolean;

    @ApiPropertyOptional({
        description: 'Dịch vụ có yêu cầu tư vấn viên hay không',
        type: 'boolean',
    })
    @IsOptional()
    @IsBoolean()
    requiresConsultant?: boolean;
    @ApiPropertyOptional({
        description: 'Địa điểm cung cấp dịch vụ',
        enum: LocationTypeEnum,
    })
    @IsOptional()
    @IsEnum(LocationTypeEnum)
    location?: LocationTypeEnum;
}
