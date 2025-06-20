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

export class CreateCycleMoodDto {
    @ApiPropertyOptional({
        description: 'Mức độ của tâm trạng',
        minimum: 1,
        maximum: 5,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(5)
    intensity?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty()
    @IsString()
    @IsUUID('4')
    @IsNotEmpty()
    cycleId: string;

    @ApiProperty()
    @IsString()
    @IsUUID('4')
    @IsNotEmpty()
    moodId: string;
}
