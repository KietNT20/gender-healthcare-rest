import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class CreateCycleMoodDto {
    @ApiProperty()
    @IsNumber()
    @IsOptional()
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
