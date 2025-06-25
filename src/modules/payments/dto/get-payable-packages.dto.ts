import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';

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
        type: 'boolean',
    })
    @IsOptional()
    @IsBooleanString()
    isActive?: string = 'true';
}
