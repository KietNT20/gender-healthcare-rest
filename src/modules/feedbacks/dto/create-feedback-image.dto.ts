import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateFeedbackImageDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    feedbackId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    imageId: string;
}
