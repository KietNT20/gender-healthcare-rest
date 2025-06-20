import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Length,
} from 'class-validator';
import {
    ProcessPriority,
    StiSampleType,
} from '../entities/sti-test-process.entity';

export class CreateStiTestProcessDto {
    @ApiProperty({
        description: 'ID của dịch vụ xét nghiệm STI',
    })
    @IsNotEmpty()
    @IsUUID()
    serviceId: string;

    @ApiProperty({
        description: 'ID của bệnh nhân',
    })
    @IsNotEmpty()
    @IsUUID()
    patientId: string;

    @ApiProperty({
        description: 'Loại mẫu xét nghiệm',
        enum: StiSampleType,
    })
    @IsNotEmpty()
    @IsEnum(StiSampleType)
    sampleType: StiSampleType;

    @ApiPropertyOptional({
        description: 'Độ ưu tiên xử lý',
        enum: ProcessPriority,
    })
    @IsOptional()
    @IsEnum(ProcessPriority)
    priority?: ProcessPriority;

    @ApiPropertyOptional({
        description: 'ID cuộc hẹn lấy mẫu',
    })
    @IsOptional()
    @IsUUID()
    appointmentId?: string;

    @ApiPropertyOptional({
        description: 'Thời gian dự kiến có kết quả',
    })
    @IsOptional()
    @IsDateString()
    estimatedResultDate?: string;

    @ApiPropertyOptional({
        description: 'Địa điểm lấy mẫu',
    })
    @IsOptional()
    @IsString()
    @Length(1, 500)
    sampleCollectionLocation?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú về quá trình',
    })
    @IsOptional()
    @IsString()
    processNotes?: string;

    @ApiPropertyOptional({
        description: 'ID bác sĩ tư vấn',
    })
    @IsOptional()
    @IsUUID()
    consultantDoctorId?: string;

    @ApiPropertyOptional({
        description: 'Có yêu cầu tư vấn hay không',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    requiresConsultation?: boolean;

    @ApiPropertyOptional({
        description: 'Có bảo mật hay không',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isConfidential?: boolean;
}
