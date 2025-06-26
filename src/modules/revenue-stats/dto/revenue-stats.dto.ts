import { ApiProperty } from '@nestjs/swagger';

export class MonthlyRevenue {
    @ApiProperty({
        description: 'Month number (1-12)',
        example: 1,
    })
    month: number;

    @ApiProperty()
    totalRevenue: number;
}
export class RevenueStatsDto {
    @ApiProperty({
        description: 'Year of the revenue data',
        example: 2025,
    })
    year: number;

    @ApiProperty({
        description: 'Month number (1-12)',
        example: 1,
        required: false,
    })
    month?: number;

    @ApiProperty({ type: [MonthlyRevenue] })
    stats: MonthlyRevenue[];
}
