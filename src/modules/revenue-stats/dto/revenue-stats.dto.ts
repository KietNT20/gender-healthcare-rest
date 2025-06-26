import { ApiProperty } from '@nestjs/swagger';

export class MonthlyRevenue {
    @ApiProperty()
    month: number;

    @ApiProperty()
    totalRevenue: number;
}
export class RevenueStatsDto {
    @ApiProperty()
    year: number;

    @ApiProperty({ type: [MonthlyRevenue] })
    stats: MonthlyRevenue[];
}

