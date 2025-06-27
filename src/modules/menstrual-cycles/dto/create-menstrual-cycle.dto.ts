import { ApiProperty } from '@nestjs/swagger';
import {
    IsDate,
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateMenstrualCycleDto {
    @ApiProperty({
        description: 'Start Date (YYYY-MM-DD)',
    })
    @IsNotEmpty({ message: 'Start date is required' })
    @IsDate()
    cycleStartDate: Date;

    @ApiProperty({
        description: 'End Date (YYYY-MM-DD)',
    })
    @IsNotEmpty({ message: 'End date is required' })
    @IsDate()
    cycleEndDate: Date;

    @ApiProperty({
        description: 'Additional notes about the cycle',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;
}
