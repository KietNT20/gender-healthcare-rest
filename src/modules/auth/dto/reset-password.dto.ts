import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';
import { REGEX } from 'src/constant';

export class ResetPasswordDto {
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
}
