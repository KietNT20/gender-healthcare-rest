import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
} from 'class-validator';
import {
    ConsultationFeeType,
    LocationTypeEnum,
    ProfileStatusType,
} from 'src/enums';

export class CreateConsultantProfileDto {
    @ApiProperty({ description: 'ID of the user this profile belongs to.' })
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    userId: string;

    @ApiProperty({
        description:
            'Chuyên môn của tư vấn viên, ví dụ: "Cardiology", "Psychology".',
        type: [String],
    })
    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
    specialties: string[];

    @ApiProperty({
        description: 'Qualification of the consultant.',
    })
    @IsNotEmpty()
    @IsString()
    qualification: string;

    @ApiProperty({ description: 'Experience of the consultant.' })
    @IsNotEmpty()
    @IsString()
    experience: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiProperty({ description: 'Consultation fee per session.' })
    @IsNumber()
    @IsPositive()
    consultationFee: number;

    @ApiProperty({
        enum: ConsultationFeeType,
        description: 'Type of consultation fee.',
    })
    @IsNotEmpty()
    @IsEnum(ConsultationFeeType)
    consultationFeeType: ConsultationFeeType = ConsultationFeeType.PER_SESSION;

    @ApiPropertyOptional({ default: 60 })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    sessionDurationMinutes?: number = 60; // Default session duration in minutes

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @ApiPropertyOptional({
        enum: ProfileStatusType,
        default: ProfileStatusType.ACTIVE,
    })
    @IsOptional()
    @IsEnum(ProfileStatusType)
    profileStatus?: ProfileStatusType;

    @ApiPropertyOptional({ type: [String], default: ['tiếng Việt'] })
    @IsOptional()
    @IsArray()
    languages?: string[];

    @ApiPropertyOptional({
        enum: LocationTypeEnum,
        isArray: true,
        default: [LocationTypeEnum.ONLINE, LocationTypeEnum.OFFICE],
    })
    @IsOptional()
    @IsArray()
    @IsEnum(LocationTypeEnum, { each: true })
    consultationTypes?: LocationTypeEnum[];
}
