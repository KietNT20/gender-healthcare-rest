import { ApiProperty } from '@nestjs/swagger';
import {
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
    @IsDateString()
    cycleStartDate: string;

    @ApiProperty({
        description: 'End Date (YYYY-MM-DD)',
    })
    @IsNotEmpty({ message: 'End date is required' })
    @IsDateString()
    cycleEndDate: string;

    @ApiProperty({
        description: 'Additional notes about the cycle',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;
}
