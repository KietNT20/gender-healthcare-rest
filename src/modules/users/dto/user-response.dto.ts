import { Exclude, Expose, Transform, Type } from 'class-transformer';
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
import { Role } from 'src/modules/roles/entities/role.entity';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Expose()
  fullName: string;

  @Expose()
  slug: string;

  @Expose()
  dateOfBirth?: Date;

  @Expose()
  gender?: GenderType;

  @Expose()
  phone?: string;

  @Expose()
  address?: string;

  @Expose()
  profilePicture?: string;

  @Expose()
  isActive: boolean;

  @Expose()
  emailVerified: boolean;

  @Expose()
  phoneVerified: boolean;

  @Expose()
  locale: string;

  @Expose()
  notificationPreferences: {
    sms: boolean;
    push: boolean;
    email: boolean;
  };

  @Expose()
  healthDataConsent: boolean;

  @Expose()
  lastLogin?: Date;

  @Expose()
  @Type(() => Role)
  role?: Role;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString()
  currentPassword: string;

  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  fullName?: string;

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
