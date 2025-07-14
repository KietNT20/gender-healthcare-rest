import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    IsUrl,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { AppointmentStatusType, SortOrder } from 'src/enums';

export class UpdateMeetingLinkDto {
    @ApiPropertyOptional({
        description: 'Meeting link (Google Meet, Zoom, etc.)',
    })
    @IsString()
    @IsUrl({}, { message: 'Meeting link must be a valid URL' })
    @IsOptional()
    meetingLink?: string;
}

export class ConsultantAppointmentsMeetingFilterDto {
    @ApiPropertyOptional({
        description: 'Filter by appointment status',
        enum: AppointmentStatusType,
    })
    @IsEnum(AppointmentStatusType)
    @IsOptional()
    status?: AppointmentStatusType;

    @ApiPropertyOptional({
        description: 'Filter by appointment date (from)',
        example: '2024-01-01',
    })
    @IsDateString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional({
        description: 'Filter by appointment date (to)',
        example: '2024-12-31',
    })
    @IsDateString()
    @IsOptional()
    dateTo?: string;

    @ApiPropertyOptional({
        description: 'Field to sort by',
        enum: ['status', 'appointmentDate', 'createdAt', 'updatedAt'],
        default: 'appointmentDate',
    })
    @IsString()
    @IsOptional()
    sortBy?: string = 'appointmentDate';

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: SortOrder,
        default: SortOrder.ASC,
    })
    @IsEnum(SortOrder)
    @IsOptional()
    sortOrder?: SortOrder = SortOrder.ASC;
}

export class ConsultantAppointmentsMeetingQueryDto extends IntersectionType(
    ConsultantAppointmentsMeetingFilterDto,
    PaginationDto,
) {}
