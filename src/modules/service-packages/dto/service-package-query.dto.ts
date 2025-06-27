import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBooleanString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
} from 'class-validator';
import { SortOrder } from 'src/enums';

export class ServicePackageQueryDto {
    @ApiPropertyOptional({ description: 'Số trang, mặc định là 1' })
    @IsOptional()
    @IsPositive()
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số bản ghi mỗi trang, mặc định là 10',
    })
    @IsOptional()
    @IsPositive()
    limit?: number = 10;

    @ApiPropertyOptional({
        description:
            'Trường sắp xếp (name, price, durationMonths, createdAt, updatedAt)',
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
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Giá tối thiểu' })
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
        description: 'Trạng thái hoạt động của gói dịch vụ',
        type: 'boolean',
    })
    @IsOptional()
    @IsBooleanString()
    isActive?: string = 'true';
}
