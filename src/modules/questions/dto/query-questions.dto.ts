import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNumberString,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { QuestionStatusType } from 'src/enums';

export class QueryQuestionsDto {
    @ApiPropertyOptional({
        description: 'Page number for pagination',
        example: 1,
    })
    @IsOptional()
    @IsNumberString()
    page?: string = '1';

    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 10,
    })
    @IsOptional()
    @IsNumberString()
    limit?: string = '10';

    @ApiPropertyOptional({
        description: 'Filter by category ID',
        example: 'uuid-category-id',
    })
    @IsOptional()
    @IsUUID('4')
    category?: string;

    @ApiPropertyOptional({
        description: 'Filter by question status',
        enum: QuestionStatusType,
    })
    @IsOptional()
    @IsEnum(QuestionStatusType)
    status?: QuestionStatusType;

    @ApiPropertyOptional({
        description: 'Search term for title and content',
        example: 'thuốc tránh thai',
    })
    @IsOptional()
    @IsString()
    search?: string;
}
