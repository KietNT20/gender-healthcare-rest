import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDate,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
} from 'class-validator';
import { GenderType } from 'src/enums';

export class CreateUserDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'First name is required' })
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Last name is required' })
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(32, { message: 'Password must not exceed 32 characters' })
    password: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate({ message: 'Date of birth must be a valid date' })
    dateOfBirth?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(GenderType, { message: 'Gender must be M, F, or O' })
    gender?: GenderType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Role ID is required' })
    @IsUUID('4', { message: 'Role ID must be a valid UUID' })
    roleId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    profilePicture?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    locale?: string = 'vi';

    @ApiPropertyOptional({
        description: 'Đồng ý cho phép thu thập dữ liệu sức khỏe',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    healthDataConsent?: boolean = false;
}
