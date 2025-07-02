import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';

export class CreateFeedbackDto {
    @ApiProperty({
        description: 'ID of the user providing feedback',
    })
    @IsOptional()
    @IsUUID('4')
    userId?: string;

    @ApiProperty({
        description: 'ID of the service being reviewed',
    })
    @IsOptional()
    @IsUUID('4')
    serviceId?: string;

    @ApiProperty({
        description: 'ID of the appointment related to the feedback',
    })
    @IsOptional()
    @IsUUID('4')
    appointmentId?: string;

    @ApiProperty({
        description: 'ID of the consultant providing the service',
    })
    @IsOptional()
    @IsUUID('4')
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
        description: 'Feedback is anonymous or not',
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
