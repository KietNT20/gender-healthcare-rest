import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDto {
    @ApiPropertyOptional({
        description: 'A new description for the document',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Update the sensitivity status of the document',
    })
    @IsOptional()
    @IsBoolean()
    isSensitive?: boolean;
}
