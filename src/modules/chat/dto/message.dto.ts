import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class SendMessageDto {
    @IsUUID()
    @IsNotEmpty()
    questionId: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsOptional()
    @IsEnum(['text', 'file', 'image'])
    messageType?: 'text' | 'file' | 'image';

    @IsOptional()
    @IsString()
    fileUrl?: string;

    @IsOptional()
    @IsString()
    fileName?: string;
}

export class ReadMessageDto {
    @IsUUID()
    @IsNotEmpty()
    questionId: string;

    @IsUUID()
    @IsNotEmpty()
    messageId: string;
}

export class GetMessagesDto {
    @IsUUID()
    @IsNotEmpty()
    questionId: string;

    @IsOptional()
    limit?: number;

    @IsOptional()
    offset?: number;
}
