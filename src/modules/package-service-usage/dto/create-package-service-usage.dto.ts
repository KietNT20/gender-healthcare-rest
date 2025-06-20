import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePackageServiceUsageDto {
  @ApiProperty({
    description: 'ID of the user package subscription',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: true,
  })
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({
    description: 'ID of the service',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: true,
  })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({
    description: 'Date of usage (ISO format)',
    example: '2025-06-19',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  usageDate?: string;
}