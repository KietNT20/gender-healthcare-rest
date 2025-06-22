import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({
    description: 'Name of the tag',
    example: 'tech',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: 'Slug of the tag (optional, auto-generated if not provided)',
    example: 'tech',
    required: false,
  })
  @IsString()
  @Length(1, 255)
  slug?: string;
}