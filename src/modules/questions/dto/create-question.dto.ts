import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({
    description: 'Question title',
    example: 'Tôi có nên sử dụng thuốc tránh thai hàng ngày không?',
    maxLength: 255,
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: 'Title must be at least 10 characters long' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Detailed question content',
    example:
      'Tôi 25 tuổi, chưa có con và đang muốn tìm hiểu về các phương pháp tránh thai...',
    minLength: 20,
  })
  @IsString()
  @MinLength(20, { message: 'Content must be at least 20 characters long' })
  content: string;

  @ApiProperty({
    description: 'Category ID for question classification',
    example: 'uuid-category-id',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  categoryId?: string;

  @ApiProperty({
    description: 'Whether the question should be public',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @ApiProperty({
    description: 'Whether the user wants to remain anonymous',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = false;
}
