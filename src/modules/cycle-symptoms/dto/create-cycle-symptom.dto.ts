import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';

export class CreateCycleSymptomDto {
    @ApiPropertyOptional({
        description: 'Intensity level of the symptom',
        minimum: 1,
        maximum: 5,
    })
    @IsNumber()
    @Min(1)
    @Max(5)
    @IsOptional()
    intensity?: number;

    @ApiPropertyOptional({
        description: 'Additional notes about the symptom',
    })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({
        description: 'ID of the menstrual cycle',
    })
    @IsString()
    @IsUUID('4')
    @IsNotEmpty()
    menstrualCycleId: string;

    @ApiProperty({
        description: 'ID of the symptom',
    })
    @IsString()
    @IsUUID('4')
    @IsNotEmpty()
    symptomId: string;
}
