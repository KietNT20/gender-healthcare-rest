import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ContentStatusType } from 'src/enums';

export class BlogResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    title: string;

    @ApiProperty()
    @Expose()
    content: string;

    @ApiProperty()
    @Expose()
    slug: string;

    @ApiProperty()
    @Expose()
    views: number;

    @ApiProperty({ enum: ContentStatusType })
    @Expose()
    status: ContentStatusType;

    @ApiProperty()
    @Expose()
    isActive: boolean;

    @ApiProperty()
    @Expose()
    categoryId?: string;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    @Exclude()
    deletedAt?: Date;

    @Exclude()
    deletedByUserId?: string;
}
