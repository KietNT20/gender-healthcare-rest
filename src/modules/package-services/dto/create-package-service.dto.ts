import { IsUUID, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePackageServiceDto {
    @ApiProperty({
        description: 'ID of the service package',
        example: '550e8400-e29b-41d4-a716-446655440001',
        required: true,
    })
    @IsUUID()
    packageId: string;

    @ApiProperty({
        description: 'ID of the service',
        example: '550e8400-e29b-41d4-a716-446655440003',
        required: true,
    })
    @IsUUID()
    serviceId: string;

    @ApiPropertyOptional({
        description: 'Quantity limit',
        example: 10,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    quantityLimit?: number;

    @ApiPropertyOptional({
        description: 'Discount percentage',
        example: 0,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    discountPercentage?: number;
}
