import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SortOrder } from 'src/enums';

export class ServiceQueryDto {
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
            'Trường sắp xếp (name, price, duration, createdAt, updatedAt)',
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
        description: 'Từ khóa tìm kiếm trong tên hoặc mô tả',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'ID của danh mục dịch vụ' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

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

    @ApiPropertyOptional({ description: 'Trạng thái hoạt động của dịch vụ' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Dịch vụ có được đánh dấu là nổi bật hay không',
    })
    @IsOptional()
    @IsBoolean()
    featured?: boolean;

    // ServiceQueryDto

    @ApiPropertyOptional({
        description: 'Dịch vụ có yêu cầu tư vấn viên hay không',
    })
    @IsOptional()
    @Type(() => Boolean) // <-- chuyển 'true'/'false' thành boolean
    @IsBoolean()
    requiresConsultant?: boolean;
}
