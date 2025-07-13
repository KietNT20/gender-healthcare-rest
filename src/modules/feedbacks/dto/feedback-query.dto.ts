import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBooleanString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { SortOrder } from 'src/enums';

export class FeedbackQueryDto {
    @ApiPropertyOptional({ description: 'Page number, default is 1' })
    @IsOptional()
    @IsPositive()
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of records per page, default is 10',
    })
    @IsOptional()
    @IsPositive()
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
    maxRating?: number;

    @ApiPropertyOptional({
        description: 'Whether the feedback is anonymous',
        type: 'boolean',
    })
    @IsOptional()
    @IsBooleanString()
    isAnonymous?: string;

    @ApiPropertyOptional({ description: 'Search keyword in comment' })
    @IsOptional()
    @IsString()
    searchComment?: string;
}
