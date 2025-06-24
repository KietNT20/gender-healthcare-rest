import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from 'src/enums';

export class FeedbackQueryDto {
    @ApiPropertyOptional({ description: 'Page number, default is 1' })
    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of records per page, default is 10',
    })
    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Field to sort by (rating, createdAt, updatedAt)',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        enum: ['ASC', 'DESC'],
        description: 'Sort order, default is DESC',
        default: 'DESC',
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({ description: 'ID of the user providing feedback' })
    @IsOptional()
    @IsUUID('4')
    userId?: string;

    @ApiPropertyOptional({ description: 'ID of the service being reviewed' })
    @IsOptional()
    @IsUUID('4')
    serviceId?: string;

    @ApiPropertyOptional({
        description: 'ID of the appointment related to the feedback',
    })
    @IsOptional()
    @IsUUID('4')
    appointmentId?: string;

    @ApiPropertyOptional({
        description: 'ID of the consultant providing the service',
    })
    @IsOptional()
    @IsUUID('4')
    consultantId?: string;

    @ApiPropertyOptional({
        description: 'Minimum rating',
        minimum: 1,
        maximum: 5,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    minRating?: number;

    @ApiPropertyOptional({
        description: 'Maximum rating',
        minimum: 1,
        maximum: 5,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    maxRating?: number;

    @ApiPropertyOptional({
        description: 'Whether the feedback is anonymous',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isAnonymous?: boolean;

    @ApiPropertyOptional({ description: 'Search keyword in comment' })
    @IsOptional()
    @IsString()
    searchComment?: string;
}
