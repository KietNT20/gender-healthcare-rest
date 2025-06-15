import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterServiceDto {
    @ApiProperty({
        required: false,
        description: 'Từ khóa tìm kiếm trong tên hoặc mô tả',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false, description: 'ID của danh mục dịch vụ' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiProperty({ required: false, description: 'Giá tối thiểu' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiProperty({ required: false, description: 'Giá tối đa' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiProperty({
        required: false,
        description: 'Trạng thái hoạt động của dịch vụ',
    })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isActive?: boolean;

    @ApiProperty({
        required: false,
        description: 'Dịch vụ có được đánh dấu là nổi bật hay không',
    })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    featured?: boolean;
}
