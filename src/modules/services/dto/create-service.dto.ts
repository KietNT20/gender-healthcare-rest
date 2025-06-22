import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    IsPositive,
    Min,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
    @ApiProperty({ description: 'Service name' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiProperty({ description: 'Detailed description of the service' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'Service price (VND)' })
    @IsNumber()
    @IsPositive()
    price: number;

    @ApiProperty({ description: 'Service duration (minutes)' })
    @IsNumber()
    @Min(1)
    duration: number;

    @ApiPropertyOptional({ description: 'Active status' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Short description' })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    shortDescription?: string;

    @ApiPropertyOptional({ description: 'Prerequisites for using the service' })
    @IsString()
    @IsOptional()
    prerequisites?: string;

    @ApiPropertyOptional({ description: 'Post-service instructions' })
    @IsString()
    @IsOptional()
    postInstructions?: string;

    @ApiPropertyOptional({ description: 'Featured service' })
    @IsBoolean()
    @IsOptional()
    featured?: boolean;

    @ApiProperty({ description: 'Category ID' })
    @IsUUID()
    @IsNotEmpty()
    categoryId: string;
}
