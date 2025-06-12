import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RolesNameEnum } from 'src/enums';

export class CreateRoleDto {
    @ApiProperty({
        enum: RolesNameEnum,
    })
    @IsNotEmpty({ message: 'Role name is required' })
    @IsEnum(RolesNameEnum)
    name: RolesNameEnum;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;
}
