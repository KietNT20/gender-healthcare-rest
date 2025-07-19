import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { CreateFeedbackDto } from './create-feedback.dto';

export class UpdateFeedbackDto extends PartialType(CreateFeedbackDto) {
    @ApiProperty({
        description: 'IDs of the tags associated with the feedback',
    })
    @IsOptional()
    @IsInt()
    rating?: number;

    @ApiProperty({
        description: 'Comments or feedback text',
        required: false,
    })
    @IsOptional()
    @IsString()
    comment?: string;

    @ApiProperty({
        description: 'Indicates if the feedback is anonymous',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    isAnonymous?: boolean;

    @ApiProperty({
        description: 'Response from the staff to the feedback',
        required: false,
    })
    @IsOptional()
    @IsString()
    staffResponse?: string;
}
