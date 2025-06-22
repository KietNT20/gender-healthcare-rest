import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { SubscriptionStatusType } from 'src/enums';

export class UpdateUserPackageSubscriptionDto {
    @ApiProperty({
        description: 'Optional start date for the subscription',
        example: '2023-10-01T00:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiProperty({
        description: 'Optional end date for the subscription',
        example: '2024-10-01T00:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiProperty({
        description: 'Optional status of the subscription',
        enum: SubscriptionStatusType,
        required: false,
    })
    @IsOptional()
    @IsEnum(SubscriptionStatusType)
    status?: SubscriptionStatusType;
}
