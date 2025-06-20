import { ApiPropertyOptional } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsPositive()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @IsPositive()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}
