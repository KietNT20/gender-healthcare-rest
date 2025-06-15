import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsPositive,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(1)
  duration: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  shortDescription?: string;

  @IsString()
  @IsOptional()
  prerequisites?: string;

  @IsString()
  @IsOptional()
  postInstructions?: string;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsUUID()
  @IsNotEmpty()
  categoryId?: string;
}
