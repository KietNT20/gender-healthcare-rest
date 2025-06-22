import {
    IsOptional,
    IsString,
    IsNumber,
    IsBoolean,
    Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServicePackageDto {
    @ApiPropertyOptional({
        description: 'Name of the service package',
        example: 'Basic Health Package',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Price of the package (VND)',
        example: 500000.0,
    })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    price?: number;

    @ApiPropertyOptional({ description: 'Duration in months', example: 1 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    durationMonths?: number;

    @ApiPropertyOptional({
        description: 'Maximum services per month',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    maxServicesPerMonth?: number;

    @ApiPropertyOptional({ description: 'Active status', example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
