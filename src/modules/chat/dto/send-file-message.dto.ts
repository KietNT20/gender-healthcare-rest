import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MessageType } from 'src/enums';

export class SendFileMessageDto {
    @ApiProperty({
        description: 'Optional message content/description for the file',
        example: 'Here is the document you requested',
        maxLength: 500,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, {
        message: 'File message description too long (max 500 characters)',
    })
    content?: string;

    @ApiProperty({
        description: 'File message type',
        enum: [MessageType.FILE, MessageType.IMAGE],
        default: MessageType.FILE,
        required: false,
    })
    @IsOptional()
    @IsEnum([MessageType.FILE, MessageType.IMAGE])
    type?: MessageType.FILE | MessageType.IMAGE;
}
