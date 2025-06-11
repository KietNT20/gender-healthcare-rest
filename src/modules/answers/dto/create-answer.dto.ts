import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateAnswerDto {
  @ApiProperty({
    description: 'Question ID to answer',
    example: 'uuid-question-id',
  })
  @IsUUID('4', { message: 'Question ID must be a valid UUID' })
  questionId: string;

  @ApiProperty({
    description: 'Answer content',
    example: 'Dựa trên thông tin bạn cung cấp, tôi khuyên bạn nên...',
    minLength: 20,
  })
  @IsString()
  @MinLength(20, {
    message: 'Answer content must be at least 20 characters long',
  })
  content: string;

  @ApiProperty({
    description:
      'Whether this answer is private (only visible to question owner)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean = false;
}
