import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SortServiceDto {
  @ApiProperty({ required: false, default: 'createdAt', description: 'Trường sắp xếp (name, price, duration, createdAt, updatedAt)' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['ASC', 'DESC'], default: 'DESC', description: 'Thứ tự sắp xếp' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}