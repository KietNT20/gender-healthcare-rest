import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ServicePackagesStatsQueryDto {
    @ApiPropertyOptional({
        description: 'Tháng cần thống kê (1-12)',
        example: 6,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(12)
    month?: number;

    @ApiPropertyOptional({
        description: 'Năm cần thống kê',
        example: 2025,
    })
    @IsOptional()
    @IsNumber()
    @Min(2000)
    year?: number;
}
