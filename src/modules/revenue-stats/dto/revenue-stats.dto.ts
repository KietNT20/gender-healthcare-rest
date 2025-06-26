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

    @ApiProperty({ type: [MonthlyRevenue] })
    stats: MonthlyRevenue[];
}

