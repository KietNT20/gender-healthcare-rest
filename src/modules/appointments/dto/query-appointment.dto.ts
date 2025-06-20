import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { AppointmentStatusType, SortOrder } from 'src/enums';

class Filters {
    @ApiPropertyOptional({ description: 'Lọc theo ID của khách hàng.' })
    @IsUUID()
    @IsOptional()
    userId?: string;

    @ApiPropertyOptional({ description: 'Lọc theo ID của tư vấn viên.' })
    @IsUUID()
    @IsOptional()
    consultantId?: string;

    @ApiPropertyOptional({ description: 'Lọc theo trạng thái cuộc hẹn.' })
    @IsEnum(AppointmentStatusType)
    @IsOptional()
    status?: AppointmentStatusType;

    @ApiPropertyOptional({
        description: 'Lọc theo ngày bắt đầu (YYYY-MM-DD).',
    })
    @IsDateString()
    @IsOptional()
    fromDate?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo ngày kết thúc (YYYY-MM-DD).',
    })
    @IsDateString()
    @IsOptional()
    toDate?: string;
}

class Sorting {
    @ApiPropertyOptional({
        enum: ['appointmentDate', 'createdAt', 'updatedAt'],
        default: 'appointmentDate',
    })
    @IsString()
    @IsOptional()
    sortBy?: string = 'appointmentDate';

    @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
    @IsEnum(SortOrder)
    @IsOptional()
    sortOrder?: SortOrder = SortOrder.ASC;
}

export class QueryAppointmentDto extends IntersectionType(
    PaginationDto,
    Filters,
    Sorting,
) {}
