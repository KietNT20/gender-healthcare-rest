import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateMoodDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;
}
