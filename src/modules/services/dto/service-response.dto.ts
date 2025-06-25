import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ServiceResponseDto {
    @Expose()
    @ApiProperty({ description: 'Service ID' })
    id: string;

    @Expose()
    @ApiProperty({ description: 'Service name' })
    name: string;

    @Expose()
    @ApiProperty({ description: 'Service slug' })
    slug: string;

    @Expose()
    @ApiProperty({ description: 'Service description' })
    description: string;

    @Expose()
    @ApiProperty({ description: 'Service price' })
    price: number;

    @Expose()
    @ApiProperty({ description: 'Service duration (minutes)' })
    duration: number;

    @Expose()
    @ApiProperty({ description: 'Active status' })
    isActive: boolean;

    @Expose()
    @ApiPropertyOptional({ description: 'Short description' })
    shortDescription?: string;

    @Expose()
    @ApiPropertyOptional({ description: 'Prerequisites for using the service' })
    prerequisites?: string;

    @Expose()
    @ApiPropertyOptional({ description: 'Post-service instructions' })
    postInstructions?: string;

    @Expose()
    @ApiProperty({ description: 'Featured service' })
    featured: boolean;

    @Expose()
    @ApiProperty({ description: 'Category ID' })
    categoryId: string;

    @Expose()
    @ApiProperty({ description: 'Creation date' })
    createdAt: Date;

    @Expose()
    @ApiProperty({ description: 'Update date' })
    updatedAt: Date;

    @Expose()
    @ApiProperty({ description: 'Required Consultant' })
    requiresConsultant: boolean; // Thêm trường này

    constructor(partial: Partial<ServiceResponseDto>) {
        Object.assign(this, partial);
    }
}
