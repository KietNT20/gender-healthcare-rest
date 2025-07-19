import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateServicePackageDto {
    @ApiProperty({
        description: 'Name of the service package',
        example: 'Basic Health Package',
        required: true,
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Price of the package (VND)',
        example: 500000.0,
        required: true,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    price: number;

    @ApiProperty({
        description: 'Duration in months',
        example: 1,
        required: true,
    })
    @IsNumber()
    @Min(1)
    durationMonths: number;

    @ApiPropertyOptional({
        description: 'Maximum services per month',
        example: 10,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    maxServicesPerMonth?: number;

    @ApiPropertyOptional({
        description: 'Active status',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
