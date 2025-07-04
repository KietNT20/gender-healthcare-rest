import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDate,
    IsEnum,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { SortOrder } from 'src/enums';
import { ProcessPriority, StiSampleType, StiTestProcessStatus } from '../enums';

export class FilterQueryStiTestProcessDto {
    @ApiPropertyOptional({
        description: 'Trạng thái quá trình xét nghiệm',
        enum: StiTestProcessStatus,
    })
    @IsOptional()
    @IsEnum(StiTestProcessStatus)
    status?: StiTestProcessStatus;

    @ApiPropertyOptional({
        description: 'Loại mẫu xét nghiệm',
        enum: StiSampleType,
    })
    @IsOptional()
    @IsEnum(StiSampleType)
    sampleType?: StiSampleType;

    @ApiPropertyOptional({
        description: 'Độ ưu tiên',
        enum: ProcessPriority,
    })
    @IsOptional()
    @IsEnum(ProcessPriority)
    priority?: ProcessPriority;

    @ApiPropertyOptional({
        description: 'ID bệnh nhân',
    })
    @IsOptional()
    @IsString()
    @IsUUID('4')
    patientId?: string;

    @ApiPropertyOptional({
        description: 'ID bác sĩ tư vấn',
    })
    @IsOptional()
    @IsString()
    @IsUUID('4')
    consultantDoctorId?: string;

    @ApiPropertyOptional({
        description: 'ID dịch vụ',
    })
    @IsOptional()
    @IsString()
    @IsUUID('4')
    serviceId?: string;

    @ApiPropertyOptional({
        description: 'Tìm kiếm theo mã xét nghiệm',
    })
    @IsOptional()
    @IsString()
    testCode?: string;

    @ApiPropertyOptional({
        description: 'Ngày bắt đầu (từ ngày)',
        example: '2024-01-01',
    })
    @IsOptional()
    @IsDate()
    startDate?: Date;

    @ApiPropertyOptional({
        description: 'Ngày kết thúc (đến ngày)',
        example: '2024-12-31',
    })
    @IsOptional()
    @IsDate()
    endDate?: Date;

    @ApiPropertyOptional({
        description: 'Yêu cầu tư vấn',
        type: 'boolean',
    })
    @IsOptional()
    @IsBoolean()
    requiresConsultation?: boolean = false;

    @ApiPropertyOptional({
        description: 'Đã thông báo bệnh nhân',
        type: 'boolean',
    })
    @IsOptional()
    @IsBoolean()
    patientNotified?: boolean = false;

    @ApiPropertyOptional({
        description: 'Chỉ hiển thị các xét nghiệm có kết quả',
        type: 'boolean',
    })
    @IsOptional()
    @IsBoolean()
    hasResults?: boolean = false;

    @ApiPropertyOptional({
        description: 'Sắp xếp theo trường',
        enum: ['createdAt', 'updatedAt', 'status', 'priority'],
        default: 'createdAt',
    })
    @IsOptional()
    @IsString()
    @IsIn(['createdAt', 'updatedAt', 'status', 'priority'])
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Thứ tự sắp xếp',
        enum: SortOrder,
        default: SortOrder.DESC,
    })
    @IsOptional()
    @IsString()
    sortOrder?: SortOrder = SortOrder.DESC;
}

export class QueryStiTestProcessDto extends IntersectionType(
    FilterQueryStiTestProcessDto,
    PaginationDto,
) {}
