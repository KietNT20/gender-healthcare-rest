import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class GetBlogMonthYear {
    @ApiPropertyOptional({
        description: 'Month number (1-12)',
        example: 1,
        type: Number,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    month?: number;

    @ApiPropertyOptional({
        description: 'Year',
        example: 2025,
        type: Number,
    })
    @IsOptional()
    @IsInt()
    @Min(2000)
    @Max(2100)
    year?: number;
}
