import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class GetPayablePackagesDto {
    @ApiPropertyOptional({
        description: 'Tìm kiếm theo tên gói',
        example: 'Basic Health',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Chỉ lấy các gói đang hoạt động',
        example: true,
        default: true,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isActive?: boolean = true;
}
