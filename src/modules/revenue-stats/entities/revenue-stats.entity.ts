import { ApiProperty } from '@nestjs/swagger';

export class MonthlyRevenue {
    @ApiProperty({
        description: 'Month number (1-12)',
        example: 1,
    })
    month: number;

    @ApiProperty({
        description: 'Total revenue for the month',
        example: 1500000,
    })
    total: number;
}