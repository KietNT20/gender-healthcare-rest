import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class GetMessagesDto {
    @ApiProperty({
        description: 'Page number for pagination',
        example: 1,
        default: 1,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    @Min(1)
    page?: number;

    @ApiProperty({
        description: 'Number of messages per page',
        example: 50,
        default: 50,
        minimum: 1,
        maximum: 100,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    @Min(1)
    @Max(100)
    limit?: number;
}
