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
    })
    @IsNotEmpty({ message: 'Question ID is required' })
    @IsUUID('4', { message: 'Question ID must be a valid UUID' })
    questionId: string;
}
