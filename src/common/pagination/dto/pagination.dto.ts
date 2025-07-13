import { ApiPropertyOptional } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
    @ApiPropertyOptional({
        description: 'Số trang',
        default: 1,
    })
    @IsOptional()
    @IsPositive()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số lượng bản ghi trên mỗi trang',
        default: 10,
    })
    @IsOptional()
    @IsPositive()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}
