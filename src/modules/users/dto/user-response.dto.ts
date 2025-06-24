import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
    IsBoolean,
    IsDate,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';
import { GenderType } from 'src/enums';
import { User } from '../entities/user.entity';
import { NotificationPreferences } from '../interfaces/notification.interface';

export class UserResponseDto extends User {
    @Exclude()
    declare password: string;
}

export class ChangePasswordDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Current password is required' })
    @IsString()
    currentPassword: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'New password is required' })
    @IsString()
    @MinLength(8, {
        message: 'New password must be at least 8 characters long',
    })
    newPassword: string;
}

export class UpdateProfileDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty()
    @IsOptional()
    @IsDate()
    dateOfBirth?: Date;

    @ApiPropertyOptional({
        enum: GenderType,
        description: 'Gender must be M, F',
    })
    @IsOptional()
    @IsEnum(GenderType, { message: 'Gender must be M, F' })
    gender?: GenderType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    profilePicture?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    locale?: string;

    @ApiPropertyOptional({
        type: 'object',
        description: 'Notification preferences for the user',
        additionalProperties: true,
        example: {
            sms: true,
            push: false,
            email: true,
        },
    })
    @IsOptional()
    @IsObject()
    notificationPreferences?: NotificationPreferences;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    healthDataConsent?: boolean;
}
