import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';
import { REGEX } from 'src/constant';
import { GenderType } from 'src/enums';

export class RegisterDto {
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
    @MaxLength(20, { message: 'Password must be less than 20 characters' })
    @Matches(REGEX.PWD, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    password: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Phone number is required' })
    @IsString()
    @Matches(REGEX.VN_PHONE, { message: 'Invalid phone number format' })
    phone: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Gender is required' })
    @IsEnum(GenderType)
    gender: GenderType;
}
