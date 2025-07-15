import {
    ApiProperty,
    ApiPropertyOptional,
    IntersectionType,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { TransformEmptyStringToUndefined } from 'src/decorators/transform-null.decorator';

export class SendPublicPdfMessageDto {
    @ApiPropertyOptional({
        description: 'Optional message content/description',
        example: 'Here is the healthcare guideline document',
    })
    @IsOptional()
    @IsString()
    @TransformEmptyStringToUndefined()
    content?: string;

    @ApiPropertyOptional({
        description: 'Description of the PDF document',
        example: 'Healthcare guidelines for women',
    })
    @IsOptional()
    @IsString()
    @TransformEmptyStringToUndefined()
    description?: string;
}

class FileUploadDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'File to upload (PDF file)',
    })
    file: any;
}

export class SendPublicPdfMessageBodyDto extends IntersectionType(
    FileUploadDto,
    SendPublicPdfMessageDto,
) {}
