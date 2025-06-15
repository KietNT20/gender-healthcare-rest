import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { MessageType } from 'src/enums';

export class CreateChatDto {
    @ApiProperty({
        description: 'Message content',
        example: 'Hello, I have a question about...',
    })
    @IsNotEmpty({ message: 'Message content is required' })
    @IsString()
    @MaxLength(5000, {
        message: 'Message content cannot exceed 5000 characters',
    })
    content: string;

    @ApiPropertyOptional({
        enum: MessageType,
        description: 'Type of message',
        default: MessageType.TEXT,
    })
    @IsOptional()
    @IsEnum(MessageType)
    type?: MessageType = MessageType.TEXT;

    @ApiProperty({
        description: 'Question ID this message belongs to',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'Question ID is required' })
    @IsUUID('4', { message: 'Question ID must be a valid UUID' })
    questionId: string;
}
