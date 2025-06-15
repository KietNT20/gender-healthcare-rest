import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class TypingDto {
    @ApiProperty({
        description: 'Question ID where user is typing',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsString()
    questionId: string;

    @ApiProperty({
        description: 'Whether user is currently typing',
        example: true,
    })
    @IsBoolean()
    isTyping: boolean;
}
