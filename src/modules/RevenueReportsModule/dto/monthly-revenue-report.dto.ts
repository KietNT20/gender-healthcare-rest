import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MonthlyRevenueReportDto {
    @ApiPropertyOptional({
        description: 'Năm cần thống kê (mặc định là năm hiện tại)',
        example: '2025',
    })
    @IsOptional()
    @IsString()
    year?: string;

    @ApiPropertyOptional({
        description: 'Tháng cần thống kê (1-12, mặc định là tất cả các tháng)',
        example: '6',
    })
    @IsOptional()
    @IsString()
    month?: string;
}