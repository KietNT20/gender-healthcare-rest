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
  @ApiProperty({ description: 'Service name', type: String })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Detailed description of the service', type: String })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Service price (VND)', type: Number })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({ description: 'Service duration (minutes)', type: Number })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ description: 'Active status', type: Boolean })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Short description', type: String })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Prerequisites for using the service', type: String })
  @IsString()
  @IsOptional()
  prerequisites?: string;

  @ApiPropertyOptional({ description: 'Post-service instructions', type: String })
  @IsString()
  @IsOptional()
  postInstructions?: string;

  @ApiPropertyOptional({ description: 'Featured service', type: Boolean })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiProperty({ description: 'Category ID', type: String })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}