import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceResponseDto {
  @Expose()
  @ApiProperty({ description: 'Service ID' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Service name' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'Service slug' })
  slug: string;

  @Expose()
  @ApiProperty({ description: 'Service description' })
  description: string;

  @Expose()
  @ApiProperty({ description: 'Service price' })
  price: number;

  @Expose()
  @ApiProperty({ description: 'Service duration (minutes)' })
  duration: number;

  @Expose()
  @ApiProperty({ description: 'Active status' })
  isActive: boolean;

  @Expose()
  @ApiPropertyOptional({ description: 'Short description' })
  shortDescription?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Prerequisites for using the service' })
  prerequisites?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Post-service instructions' })
  postInstructions?: string;

  @Expose()
  @ApiProperty({ description: 'Featured service' })
  featured: boolean;

  @Expose()
  @ApiProperty({ description: 'Category ID' })
  categoryId: string;

  @Expose()
  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Update date' })
  updatedAt: Date;

  constructor(partial: Partial<ServiceResponseDto>) {
    Object.assign(this, partial);
  }
}

// Giữ nguyên UpdateServiceProfileDto như bạn đã cung cấp
export class UpdateServiceProfileDto {
  @ApiPropertyOptional({ description: 'Service name', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Detailed description of the service', type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Service price (VND)', type: Number })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ description: 'Service duration (minutes)', type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ description: 'Active status', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Short description', type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Prerequisites for using the service', type: String })
  @IsOptional()
  @IsString()
  prerequisites?: string;

  @ApiPropertyOptional({ description: 'Post-service instructions', type: String })
  @IsOptional()
  @IsString()
  postInstructions?: string;

  @ApiPropertyOptional({ description: 'Featured service', type: Boolean })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Category ID', type: String })
  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  categoryId?: string;
}