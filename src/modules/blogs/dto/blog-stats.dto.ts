import { ApiProperty } from '@nestjs/swagger';

export class MonthlyBlogStats {
    @ApiProperty({
        description: 'Month number (1-12)',
        example: 1,
    })
    month: number;

    @ApiProperty({
        description: 'Number of blogs created',
        example: 10,
    })
    createdCount: number;

    @ApiProperty({
        description: 'Number of blogs pending review',
        example: 5,
    })
    pendingCount: number;

    @ApiProperty({
        description: 'Number of blogs approved',
        example: 8,
    })
    approvedCount: number;
}

export class BlogStatsDto {
    @ApiProperty({
        description: 'Year of the blog statistics',
        example: 2025,
    })
    year: number;

    @ApiProperty({
        description: 'Month number (1-12)',
        example: 1,
        required: false,
    })
    month?: number;

    @ApiProperty({ type: [MonthlyBlogStats] })
    stats: MonthlyBlogStats[];
}
