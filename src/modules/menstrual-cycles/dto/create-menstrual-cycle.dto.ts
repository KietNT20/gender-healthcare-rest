import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty } from 'class-validator';

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
}
