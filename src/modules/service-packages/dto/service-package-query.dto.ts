import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
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
        enum: SortOrder,
        description: 'Thứ tự sắp xếp, mặc định là DESC',
        default: SortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;

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
        type: Number,
        enum: [0, 1],
        example: 1,
    })
    @IsOptional()
    @IsIn([0, 1])
    @Transform(({ value }) => (value === 1 || value === '1' ? 1 : 0), { toClassOnly: true })
    isActive?: number;
}