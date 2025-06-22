import { IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePackageServiceDto {
    @ApiPropertyOptional({ description: 'Quantity limit', example: 10 })
    @IsOptional()
    @IsNumber()
    quantityLimit?: number;

    @ApiPropertyOptional({ description: 'Discount percentage', example: 0 })
    @IsOptional()
    @IsNumber()
    discountPercentage?: number;
}
