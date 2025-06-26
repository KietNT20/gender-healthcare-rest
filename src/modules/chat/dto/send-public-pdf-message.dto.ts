import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SendPublicPdfMessageDto {
    @ApiPropertyOptional({
        description: 'Optional message content/description',
        example: 'Here is the healthcare guideline document',
    })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({
        description: 'Description of the PDF document',
        example: 'Healthcare guidelines for women',
    })
    @IsOptional()
    @IsString()
    description?: string;
}
