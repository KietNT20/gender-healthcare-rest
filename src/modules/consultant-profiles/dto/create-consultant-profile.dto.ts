import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { LocationTypeEnum, ProfileStatusType } from 'src/enums';

export class CreateConsultantProfileDto {
    @ApiProperty({ description: 'ID of the user this profile belongs to.' })
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    userId: string;

    @ApiProperty({
        description:
            'Specialties of the consultant, e.g., "Cardiology", "Psychology".',
        type: [String],
    })
    @IsNotEmpty()
    @IsArray()
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
