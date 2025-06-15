import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description?: string;

    @IsString()
    slug: string;

    @IsString()
    type: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsUUID()
    parentId?: string;
}
