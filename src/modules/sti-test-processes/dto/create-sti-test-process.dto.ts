import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDate,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Length,
} from 'class-validator';
import { ProcessPriority, StiSampleType } from '../enums';

export class CreateStiTestProcessDto {
    @ApiProperty({
        description: 'ID của dịch vụ xét nghiệm STI',
    })
    @IsNotEmpty()
    @IsUUID('4')
    serviceId: string;

    @ApiProperty({
        description: 'ID của bệnh nhân',
    })
    @IsNotEmpty()
    @IsUUID('4')
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
    @IsUUID('4')
    appointmentId?: string;

    @ApiPropertyOptional({
        description: 'Thời gian dự kiến có kết quả',
    })
    @IsOptional()
    @IsDate()
    estimatedResultDate?: Date;

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
    @IsUUID('4')
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
