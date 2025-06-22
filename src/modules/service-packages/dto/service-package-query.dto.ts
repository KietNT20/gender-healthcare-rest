import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from 'src/enums';

export class ServicePackageQueryDto {
    @ApiPropertyOptional({ description: 'Số trang, mặc định là 1', example: 1 })
    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số bản ghi mỗi trang, mặc định là 10',
        example: 10,
    })
    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    limit?: number = 10;

    @ApiPropertyOptional({
        description:
            'Trường sắp xếp (name, price, durationMonths, createdAt, updatedAt)',
        example: 'createdAt',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        enum: ['ASC', 'DESC'],
        description: 'Thứ tự sắp xếp, mặc định là DESC',
        default: 'DESC',
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm trong tên',
        example: 'Basic',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Giá tối thiểu', example: 100000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Giá tối đa', example: 1000000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        description: 'Trạng thái hoạt động của gói dịch vụ',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isActive?: boolean;
}
