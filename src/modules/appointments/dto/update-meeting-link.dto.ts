import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { AppointmentStatusType } from 'src/enums';

export class UpdateMeetingLinkDto {
    @ApiProperty({
        description: 'Meeting link (Google Meet, Zoom, etc.)',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsUrl({}, { message: 'Meeting link must be a valid URL' })
    meetingLink?: string;
}

export class ConsultantAppointmentsMeetingQueryDto {
    @ApiProperty({
        description: 'Filter by appointment status',
        required: false,
        enum: AppointmentStatusType,
    })
    @IsOptional()
    @IsEnum(AppointmentStatusType)
    status?: AppointmentStatusType;

    @ApiProperty({
        description: 'Filter by appointment date (from)',
        required: false,
        example: '2024-01-01',
    })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiProperty({
        description: 'Filter by appointment date (to)',
        required: false,
        example: '2024-12-31',
    })
    @IsOptional()
    @IsString()
    dateTo?: string;
}
