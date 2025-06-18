import { Exclude } from 'class-transformer';
import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';
import { GenderType } from 'src/enums';
import { User } from '../entities/user.entity';

export class UserResponseDto extends User {
    @Exclude()
    declare password: string;
}

export class ChangePasswordDto {
    @IsNotEmpty({ message: 'Current password is required' })
    @IsString()
    currentPassword: string;

    @IsNotEmpty({ message: 'New password is required' })
    @IsString()
    @MinLength(8, {
        message: 'New password must be at least 8 characters long',
    })
    newPassword: string;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Date of birth must be a valid date' })
    dateOfBirth?: string;

    @IsOptional()
    @IsEnum(GenderType, { message: 'Gender must be M, F, or O' })
    gender?: GenderType;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    profilePicture?: string;

    @IsOptional()
    @IsString()
    locale?: string;

    @IsOptional()
    notificationPreferences?: {
        sms: boolean;
        push: boolean;
        email: boolean;
    };

    @IsOptional()
    @IsBoolean()
    healthDataConsent?: boolean;
}
