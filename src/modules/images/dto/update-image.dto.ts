import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateImageDto {
    @ApiPropertyOptional({
        description:
            'Alternative text for the image, used for accessibility (SEO)',
        example: 'A beautiful landscape',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    altText?: string;
}
