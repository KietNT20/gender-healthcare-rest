import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GenerateScheduleDto {
    @ApiPropertyOptional({
        description: 'Number of weeks to generate schedule for',
        default: 4,
        minimum: 1,
        maximum: 12,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    weeksToGenerate?: number = 4;
}
