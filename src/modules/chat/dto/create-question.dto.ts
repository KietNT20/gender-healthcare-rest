import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateQuestionDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    content: string;
}
