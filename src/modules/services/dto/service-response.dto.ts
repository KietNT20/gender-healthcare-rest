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


