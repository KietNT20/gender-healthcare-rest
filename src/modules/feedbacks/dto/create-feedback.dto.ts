// src/modules/feedbacks/dto/create-feedback.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
    IsUUID,
    IsOptional,
    IsInt,
    Min,
    Max,
    IsString,
    IsBoolean,
    IsArray,
} from 'class-validator';

export class CreateFeedbackDto {
    @ApiProperty({
        description: 'ID of the user providing feedback',
    })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiProperty({
        description: 'ID of the service being reviewed',
    })
    @IsOptional()
    @IsUUID()
    serviceId?: string;

    @ApiProperty({
        description: 'ID of the appointment related to the feedback',
    })
    @IsOptional()
    @IsUUID()
    appointmentId?: string;

    @ApiProperty({
        description: 'ID of the consultant providing the service',
    })
    @IsOptional()
    @IsUUID()
    consultantId?: string;

    @ApiProperty({
        description: 'Rating given by the user',
        minimum: 1,
        maximum: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiProperty({
        description: 'Comments or feedback text',
        required: false,
    })
    @IsOptional()
    @IsString()
    comment?: string;

    @ApiProperty({
        description: 'List of image URLs related to the feedback',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isAnonymous?: boolean;

    @ApiProperty({
        description: 'Staff response to the feedback',
        required: false,
    })
    @IsOptional()
    @IsString()
    staffResponse?: string;
}
