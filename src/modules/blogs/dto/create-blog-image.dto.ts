import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateBlogImageDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    blogId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    imageId: string;
}
