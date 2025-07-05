import {
    ApiProperty,
    ApiPropertyOptional,
    IntersectionType,
} from '@nestjs/swagger';
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
    @ApiProperty({
        description: 'Meeting link (Google Meet, Zoom, etc.)',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsUrl({}, { message: 'Meeting link must be a valid URL' })
    meetingLink?: string;
}

export class ConsultantAppointmentsMeetingFilterDto {
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
    @IsDateString()
    dateFrom?: string;

    @ApiProperty({
        description: 'Filter by appointment date (to)',
        required: false,
        example: '2024-12-31',
    })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({
        enum: ['status'],
        default: 'status',
    })
    @IsString()
    @IsOptional()
    sortBy?: string = 'status';

    @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
    @IsEnum(SortOrder)
    @IsOptional()
    sortOrder?: SortOrder = SortOrder.DESC;
}

export class ConsultantAppointmentsMeetingQueryDto extends IntersectionType(
    ConsultantAppointmentsMeetingFilterDto,
    PaginationDto,
) {}
