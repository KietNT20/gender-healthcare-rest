import {
    ApiProperty,
    ApiPropertyOptional,
    IntersectionType,
} from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransformEmptyStringToUndefined } from 'src/decorators/transform-null.decorator';
import { MessageType } from 'src/enums';

export class SendFileMessageDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @TransformEmptyStringToUndefined()
    content?: string;

    @ApiProperty({
        enum: [MessageType.FILE, MessageType.IMAGE],
        description: 'Type of the message',
        default: MessageType.FILE,
    })
    @IsEnum([MessageType.FILE, MessageType.IMAGE])
    type: MessageType = MessageType.FILE;
}

class FileUploadDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'File to upload (image or document)',
    })
    file: any;
}

export class SendFileMessageBodyDto extends IntersectionType(
    FileUploadDto,
    SendFileMessageDto,
) {}
