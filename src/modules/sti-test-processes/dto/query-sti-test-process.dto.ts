import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { SortOrder } from 'src/enums';
import {
    ProcessPriority,
    StiSampleType,
    StiTestProcessStatus,
} from '../entities/sti-test-process.entity';

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
    @IsUUID()
    patientId?: string;

    @ApiPropertyOptional({
        description: 'ID bác sĩ tư vấn',
    })
    @IsOptional()
    @IsUUID()
    consultantDoctorId?: string;

    @ApiPropertyOptional({
        description: 'ID dịch vụ',
    })
    @IsOptional()
    @IsUUID()
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
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Ngày kết thúc (đến ngày)',
        example: '2024-12-31',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'Yêu cầu tư vấn',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    requiresConsultation?: boolean;

    @ApiPropertyOptional({
        description: 'Đã thông báo bệnh nhân',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    patientNotified?: boolean;

    @ApiPropertyOptional({
        description: 'Chỉ hiển thị các xét nghiệm có kết quả',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    hasResults?: boolean;

    @ApiPropertyOptional({
        description: 'Sắp xếp theo trường',
        example: 'createdAt',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Thứ tự sắp xếp',
        enum: SortOrder,
    })
    @IsOptional()
    @IsString()
    sortOrder?: SortOrder = SortOrder.DESC;
}

export class QueryStiTestProcessDto extends IntersectionType(
    FilterQueryStiTestProcessDto,
    PaginationDto,
) {}
