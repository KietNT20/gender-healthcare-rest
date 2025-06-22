import { IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserPackageSubscriptionDto {
  @ApiProperty({ description: 'ID of the user', example: '550e8400-e29b-41d4-a716-446655440000', required: true })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'ID of the service package', example: '550e8400-e29b-41d4-a716-446655440001', required: true })
  @IsUUID()
  packageId: string;

  @ApiProperty({ description: 'ID of the payment', example: '550e8400-e29b-41d4-a716-446655440002', required: true })
  @IsUUID()
  paymentId: string;
}