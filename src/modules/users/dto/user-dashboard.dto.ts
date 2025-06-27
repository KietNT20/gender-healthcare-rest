import { Type } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';

export class PeriodStatsDto {
    @IsDateString()
    @Type(() => Date)
    startDate: Date;

    @IsDateString()
    @Type(() => Date)
    endDate: Date;
}

export class DashboardQueryDto {
    @IsOptional()
    @IsDateString()
    @Type(() => Date)
    startDate?: Date;

    @IsOptional()
    @IsDateString()
    @Type(() => Date)
    endDate?: Date;
}
