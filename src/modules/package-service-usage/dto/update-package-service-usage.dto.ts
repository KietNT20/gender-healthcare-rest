import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePackageServiceUsageDto {
  @ApiPropertyOptional({
    description: 'Date of usage (ISO format)',
    example: '2025-06-19',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  usageDate?: string;
}