import { IsUUID, IsDate, IsOptional } from 'class-validator';
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

  @ApiProperty({
    description: 'ID of the appointment',
    example: '550e8400-e29b-41d4-a716-446655440003',
    required: true,
  })
  @IsUUID()
  appointmentId: string;

  @ApiPropertyOptional({
    description: 'Date of usage',
    example: '2025-06-19',
    required: false,
  })
  @IsDate()
  @IsOptional()
  usageDate?: Date;

  @ApiPropertyOptional({
    description: 'Date of deletion (for soft delete)',
    example: '2025-06-20',
    required: false,
  })
  @IsDate()
  @IsOptional()
  deletedAt?: Date;
}