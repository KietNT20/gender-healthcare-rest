import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({description: 'Category name',example: 'Health', required: true})
    @IsString()
    name: string;

    @ApiProperty({description: 'Category description', example: 'Health related services', required: false})
    @IsNotEmpty()
    @IsString()
    description?: string;

    @ApiProperty({description: 'Category slug', example: 'health', required: true})
    @IsString()
    slug: string;

    @ApiProperty({description: 'Category type', example: 'service', required: true})
    @IsString()
    type: string;

    @ApiPropertyOptional({description: 'Active status', example: true, required: false})
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({description: 'Parent category ID', example: '123e4567-e89b-12d3-a456-426614174000', required: false})
    @IsOptional()
    @IsUUID()
    parentId?: string;
}