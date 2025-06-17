import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({
        description: 'Message content',
        example: 'Hello, I have a question about...',
        maxLength: 5000,
    })
    @IsNotEmpty({ message: 'Message content is required' })
    @IsString()
    @MaxLength(5000, {
        message: 'Message content cannot exceed 5000 characters',
    })
    content: string;
}

export class SendFileMessageDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'File to upload',
    })
    file: Express.Multer.File;

    @ApiPropertyOptional({
        description: 'Optional message content to accompany the file',
        example: 'Here is the document you requested',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, {
        message: 'File message content cannot exceed 500 characters',
    })
    content?: string;
}
