import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsDate,
    IsDateString,
    IsIn,
    IsNumber,
    IsOptional,
} from 'class-validator';

export class PeriodStatsDto {
    @ApiProperty()
    @IsDate()
    startDate: Date;

    @ApiProperty()
    @IsDate()
    endDate: Date;
}

export class DashboardQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    @Type(() => Date)
    startDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    @Type(() => Date)
    endDate?: Date;
}

export class UserActiveStatsPeriodDto {
    @IsOptional()
    @IsIn(['month', 'quarter', 'year'])
    periodType?: 'month' | 'quarter' | 'year' = 'month';

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    periodCount?: number = 12;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    includeCurrentPeriod?: boolean = true;
}

export class UserActiveStatsComparisonDto {
    @IsIn(['month', 'quarter', 'year'])
    periodType: 'month' | 'quarter' | 'year' = 'month';
}
