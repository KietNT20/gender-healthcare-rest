import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { SortOrder } from 'src/enums';

export class ServiceQueryDto {
    @ApiPropertyOptional({ description: 'Số trang, mặc định là 1', type: Number })
    @IsOptional()
    @IsPositive()
    page: number = 1;

    @ApiPropertyOptional({ description: 'Số bản ghi mỗi trang, mặc định là 10', type: Number })
    @IsOptional()
    @IsPositive()
    limit: number = 10;

    @ApiPropertyOptional({ description: 'Trường sắp xếp (name, price, duration, createdAt, updatedAt)', type: String })
    @IsOptional()
    @IsString()
    sortBy: string = 'createdAt';

    @ApiPropertyOptional({
        enum: SortOrder,
        description: 'Thứ tự sắp xếp, mặc định là DESC',
        default: SortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder: SortOrder = SortOrder.DESC;

    @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm trong tên hoặc mô tả', type: String })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'ID của danh mục dịch vụ', type: String })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Giá tối thiểu', type: Number })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Giá tối đa', type: Number })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        description: 'Trạng thái hoạt động của dịch vụ',
        type: Number,
        enum: [0, 1],
    })
    @IsOptional()
    @IsIn([0, 1])
    @Transform(({ value }) => (value === 1 || value === '1' ? 1 : 0), { toClassOnly: true })
    isActive?: number;

    @ApiPropertyOptional({
        description: 'Dịch vụ có được đánh dấu là nổi bật hay không',
        type: Number,
        enum: [0, 1],
    })
    @IsOptional()
    @IsIn([0, 1])
    @Transform(({ value }) => (value === 1 || value === '1' ? 1 : 0), { toClassOnly: true })
    featured?: number;

    @ApiPropertyOptional({
        description: 'Dịch vụ có yêu cầu tư vấn viên hay không',
        type: Number,
        enum: [0, 1],
    })
    @IsOptional()
    @IsIn([0, 1])
    @Transform(({ value }) => (value === 1 || value === '1' ? 1 : 0), { toClassOnly: true })
    requiresConsultant?: number;
}