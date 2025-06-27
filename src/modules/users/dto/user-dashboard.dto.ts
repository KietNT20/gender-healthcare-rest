import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBooleanString,
    IsDate,
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
    @IsDate()
    startDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    endDate?: Date;
}

export class UserActiveStatsPeriodDto {
    @ApiPropertyOptional({
        enum: ['month', 'quarter', 'year'],
        default: 'month',
    })
    @IsOptional()
    @IsIn(['month', 'quarter', 'year'])
    periodType?: 'month' | 'quarter' | 'year' = 'month';

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    periodCount?: number = 12;

    @ApiPropertyOptional({
        type: 'boolean',
    })
    @IsOptional()
    @IsBooleanString()
    includeCurrentPeriod?: string = 'true';
}

export class UserActiveStatsComparisonDto {
    @ApiProperty({
        enum: ['month', 'quarter', 'year'],
        default: 'month',
    })
    @IsIn(['month', 'quarter', 'year'])
    periodType: 'month' | 'quarter' | 'year' = 'month';
}
