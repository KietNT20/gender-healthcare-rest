import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateContractFileDto {
    @ApiPropertyOptional({
        description:
            'The type of the linked file (e.g., "Signed PDF", "Draft")',
        example: 'Signed PDF',
    })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    fileType?: string;

    @ApiPropertyOptional({
        description: 'Additional notes about this specific file link',
    })
    @IsString()
    @IsOptional()
    notes?: string;
}
