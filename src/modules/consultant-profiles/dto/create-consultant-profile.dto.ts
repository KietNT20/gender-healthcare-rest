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
    @IsUUID('4')
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'Specialization of the consultant.' })
    @IsString()
    @IsNotEmpty()
    specialization: string;

    @ApiProperty({
        description: 'Qualification of the consultant.',
    })
    @IsString()
    @IsNotEmpty()
    qualification: string;

    @ApiProperty({ description: 'Experience of the consultant.' })
    @IsString()
    @IsNotEmpty()
    experience: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    bio?: string;

    @ApiProperty({ description: 'Consultation fee per session.' })
    @IsNumber()
    @IsPositive()
    consultationFee: number;

    @ApiPropertyOptional({ default: true })
    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;

    @ApiPropertyOptional({
        enum: ProfileStatusType,
        default: ProfileStatusType.ACTIVE,
    })
    @IsEnum(ProfileStatusType)
    @IsOptional()
    profileStatus?: ProfileStatusType;

    @ApiPropertyOptional({ example: ['Tiếng Việt', 'English'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    languages?: string[];

    @ApiPropertyOptional({
        enum: LocationTypeEnum,
        isArray: true,
        default: [LocationTypeEnum.ONLINE, LocationTypeEnum.OFFICE],
    })
    @IsArray()
    @IsEnum(LocationTypeEnum, { each: true })
    @IsOptional()
    consultationTypes?: LocationTypeEnum[];
}
