import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PublishBlogDto {
    @ApiPropertyOptional({
        description: 'Notes for publishing the blog',
    })
    @IsOptional()
    @IsString()
    publishNotes?: string;
}
