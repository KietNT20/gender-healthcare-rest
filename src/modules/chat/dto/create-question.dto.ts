import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

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

    @ApiProperty({ description: 'ID của danh mục liên quan' })
    @IsUUID()
    @IsNotEmpty()
    categoryId: string;

    @ApiProperty({ description: 'Gửi câu hỏi ẩn danh', default: false })
    @IsBoolean()
    @IsOptional()
    isAnonymous?: boolean = false;
}
