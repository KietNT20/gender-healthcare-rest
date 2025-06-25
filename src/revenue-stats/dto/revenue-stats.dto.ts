import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class GetMonthlyRevenueDto {
    @ApiProperty({
        description: 'Year to retrieve revenue statistics',
        example: 2025,
    })
    @IsNumber()
    @Min(2000)
    year: number;
}