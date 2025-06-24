import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentStatusType } from 'src/enums';

export class ReviewBlogDto {
    @ApiProperty({
        description: 'Review action for the blog',
        enum: [
            ContentStatusType.APPROVED,
            ContentStatusType.REJECTED,
            ContentStatusType.NEEDS_REVISION,
        ],
    })
    @IsEnum([
        ContentStatusType.APPROVED,
        ContentStatusType.REJECTED,
        ContentStatusType.NEEDS_REVISION,
    ])
    status: ContentStatusType;

    @ApiPropertyOptional({
        description: 'Rejection reason (required when rejecting)',
    })
    @IsOptional()
    @IsString()
    rejectionReason?: string;

    @ApiPropertyOptional({
        description: 'Revision notes (for needs revision status)',
    })
    @IsOptional()
    @IsString()
    revisionNotes?: string;
}
