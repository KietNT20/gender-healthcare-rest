import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    page: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    limit: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    roleId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;
}
