import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinRoomDto {
    @ApiProperty({
        description: 'Question ID to join chat room',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsString()
    questionId: string;
}
