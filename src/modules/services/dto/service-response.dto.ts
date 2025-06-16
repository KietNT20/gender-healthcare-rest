import { Exclude, Expose, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, IsNotEmpty, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from 'src/modules/categories/entities/category.entity';

export class ServiceResponseDto {
  @Expose()
  @ApiProperty({ description: 'ID dịch vụ' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Tên dịch vụ' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'Slug của dịch vụ' })
  slug: string;

  @Expose()
  @ApiProperty({ description: 'Mô tả dịch vụ' })
  description: string;

  @Expose()
  @ApiProperty({ description: 'Giá dịch vụ' })
  price: number;

  @Expose()
  @ApiProperty({ description: 'Thời lượng dịch vụ (phút)' })
  duration: number;

  @Expose()
  @ApiProperty({ description: 'Trạng thái hoạt động' })
  isActive: boolean;

  @Expose()
  @ApiPropertyOptional({ description: 'Mô tả ngắn' })
  shortDescription?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Yêu cầu trước khi sử dụng dịch vụ' })
  prerequisites?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Hướng dẫn sau khi sử dụng dịch vụ' })
  postInstructions?: string;

  @Expose()
  @ApiProperty({ description: 'Dịch vụ nổi bật' })
  featured: boolean;

  @Expose()
  @Type(() => Category)
  @ApiProperty({ description: 'Danh mục dịch vụ' })
  category?: Category;

  @Expose()
  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Ngày cập nhật' })
  updatedAt: Date;

  constructor(partial: Partial<ServiceResponseDto>) {
    Object.assign(this, partial);
  }
}

export class UpdateServiceProfileDto {
  @ApiPropertyOptional({ description: 'Tên dịch vụ', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Slug của dịch vụ', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({ description: 'Mô tả dịch vụ' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Giá dịch vụ' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ description: 'Thời lượng dịch vụ (phút)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Mô tả ngắn', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Yêu cầu trước khi sử dụng dịch vụ' })
  @IsOptional()
  @IsString()
  prerequisites?: string;

  @ApiPropertyOptional({ description: 'Hướng dẫn sau khi sử dụng dịch vụ' })
  @IsOptional()
  @IsString()
  postInstructions?: string;

  @ApiPropertyOptional({ description: 'Dịch vụ nổi bật' })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'ID danh mục dịch vụ' })
  @IsOptional()
  @IsUUID('4', { message: 'ID danh mục phải là UUID hợp lệ' })
  categoryId?: string;
}