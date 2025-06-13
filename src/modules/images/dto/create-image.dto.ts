import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateImageDto {
    @ApiProperty({ type: 'string', format: 'binary', required: true })
    file: Express.Multer.File;

    @ApiPropertyOptional({
        description: 'Alternative text for the image',
        example: 'A beautiful landscape',
    })
    @IsOptional()
    @IsString()
    altText?: string;

    @ApiPropertyOptional({
        description:
            'Type of entity the image is associated with (e.g., "blog", "user_profile")',
    })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({
        description: 'ID of the entity the image is associated with',
    })
    @IsOptional()
    @IsUUID()
    entityId?: string;

    @ApiPropertyOptional({
        description: 'Whether the image is public',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isPublic: boolean = true;
}
