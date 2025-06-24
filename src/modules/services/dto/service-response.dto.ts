import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

class ImageDto {
    @Expose()
    @ApiProperty({ description: 'Image ID' })
    id: string;

    @Expose()
    @ApiProperty({ description: 'Image name' })
    name: string;

    @Expose()
    @ApiProperty({ description: 'Original image name' })
    originalName: string;

    @Expose()
    @ApiProperty({ description: 'Image size in bytes' })
    size: number;

    @Expose()
    @ApiProperty({ description: 'Image width in pixels' })
    width: number;

    @Expose()
    @ApiProperty({ description: 'Image height in pixels' })
    height: number;

    @Expose()
    @ApiProperty({ description: 'Image format' })
    format: string;

    @Expose()
    @ApiProperty({ description: 'Alternative text for image' })
    altText: string;

    @Expose()
    @ApiProperty({ description: 'Entity type (e.g., service)' })
    entityType: string;

    @Expose()
    @ApiProperty({ description: 'Entity ID associated with image' })
    entityId: string;

    @Expose()
    @ApiProperty({ description: 'Public visibility status' })
    isPublic: boolean;

    @Expose()
    @ApiProperty({ description: 'Image URL' })
    url: string;

    @Expose()
    @ApiProperty({ description: 'Creation date' })
    createdAt: Date;

    @Expose()
    @ApiProperty({ description: 'Update date' })
    updatedAt: Date;
}

class CategoryDto {
    @Expose()
    @ApiProperty({ description: 'Category ID' })
    id: string;

    @Expose()
    @ApiProperty({ description: 'Category name' })
    name: string;

    @Expose()
    @ApiProperty({ description: 'Category slug' })
    slug: string;

    @Expose()
    @ApiProperty({ description: 'Category description' })
    description: string;

    @Expose()
    @ApiProperty({ description: 'Category type' })
    type: string;

    @Expose()
    @ApiProperty({ description: 'Active status' })
    isActive: boolean;

    @Expose()
    @ApiProperty({ description: 'Creation date' })
    createdAt: Date;

    @Expose()
    @ApiProperty({ description: 'Update date' })
    updatedAt: Date;

    @Expose()
    @ApiProperty({ description: 'Deletion date', nullable: true })
    deletedAt: Date | null;
}

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
    @ApiProperty({ description: 'Category details', type: CategoryDto })
    category: CategoryDto;

    @Expose()
    @ApiProperty({ description: 'List of images', type: [ImageDto] })
    images: ImageDto[];

    @Expose()
    @ApiProperty({ description: 'Creation date' })
    createdAt: Date;

    @Expose()
    @ApiProperty({ description: 'Update date' })
    updatedAt: Date;

    @Expose()
    @ApiProperty({ description: 'Required Consultant' })
    requiresConsultant: boolean;

    constructor(partial: Partial<ServiceResponseDto>) {
        Object.assign(this, partial);
    }
}