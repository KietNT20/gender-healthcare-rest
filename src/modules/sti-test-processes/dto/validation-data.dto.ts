import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsDate,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export enum DeliveryMethod {
    IN_PERSON = 'in_person',
    EMAIL = 'email',
    PORTAL = 'portal',
    PHONE = 'phone',
}

export enum UrgencyLevel {
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum FollowUpType {
    TREATMENT = 'treatment',
    MONITORING = 'monitoring',
    RETEST = 'retest',
}

export class ValidationDataDto {
    // Cho SAMPLE_COLLECTION_SCHEDULED
    @ApiPropertyOptional({ description: 'ID của cuộc hẹn lấy mẫu' })
    @IsOptional()
    @IsUUID('4')
    appointmentId?: string;

    // Cho SAMPLE_COLLECTED
    @ApiPropertyOptional({ description: 'Người lấy mẫu' })
    @IsOptional()
    @IsString()
    sampleCollectedBy?: string;

    @ApiPropertyOptional({ description: 'Thời gian lấy mẫu' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    sampleCollectionDate?: Date;

    @ApiPropertyOptional({ description: 'Ghi chú về chất lượng mẫu' })
    @IsOptional()
    @IsString()
    sampleQualityNotes?: string;

    // Cho PROCESSING
    @ApiPropertyOptional({ description: 'Lab xử lý mẫu' })
    @IsOptional()
    @IsString()
    labProcessedBy?: string;

    @ApiPropertyOptional({ description: 'Số batch của lab' })
    @IsOptional()
    @IsString()
    labBatchNumber?: string;

    @ApiPropertyOptional({ description: 'Thời gian bắt đầu xử lý' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    processingStartDate?: Date;

    // Cho RESULT_READY
    @ApiPropertyOptional({ description: 'ID kết quả xét nghiệm' })
    @IsOptional()
    @IsUUID('4')
    testResultId?: string;

    @ApiPropertyOptional({ description: 'Người validate kết quả' })
    @IsOptional()
    @IsString()
    resultValidatedBy?: string;

    @ApiPropertyOptional({ description: 'Thời gian validate kết quả' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    resultValidationDate?: Date;

    // Cho RESULT_DELIVERED
    @ApiPropertyOptional({ description: 'Đã giao cho bệnh nhân' })
    @IsOptional()
    @IsBoolean()
    deliveredToPatient?: boolean;

    @ApiPropertyOptional({
        description: 'Phương thức giao kết quả',
        enum: DeliveryMethod,
    })
    @IsOptional()
    @IsEnum(DeliveryMethod)
    deliveryMethod?: DeliveryMethod;

    @ApiPropertyOptional({ description: 'Người giao kết quả' })
    @IsOptional()
    @IsString()
    deliveredBy?: string;

    @ApiPropertyOptional({ description: 'Thời gian giao kết quả' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    deliveryDate?: Date;

    // Cho CONSULTATION_REQUIRED
    @ApiPropertyOptional({ description: 'ID bác sĩ tư vấn' })
    @IsOptional()
    @IsUUID('4')
    consultantDoctorId?: string;

    @ApiPropertyOptional({ description: 'Lý do cần tư vấn' })
    @IsOptional()
    @IsString()
    consultationReason?: string;

    @ApiPropertyOptional({
        description: 'Mức độ khẩn cấp',
        enum: UrgencyLevel,
    })
    @IsOptional()
    @IsEnum(UrgencyLevel)
    urgencyLevel?: UrgencyLevel;

    // Cho FOLLOW_UP_SCHEDULED
    @ApiPropertyOptional({ description: 'ID cuộc hẹn theo dõi' })
    @IsOptional()
    @IsUUID('4')
    followUpAppointmentId?: string;

    @ApiPropertyOptional({
        description: 'Loại theo dõi',
        enum: FollowUpType,
    })
    @IsOptional()
    @IsEnum(FollowUpType)
    followUpType?: FollowUpType;

    @ApiPropertyOptional({ description: 'Thời gian theo dõi' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    followUpDate?: Date;

    // Cho CANCELLED
    @ApiPropertyOptional({ description: 'Lý do hủy' })
    @IsOptional()
    @IsString()
    cancellationReason?: string;

    @ApiPropertyOptional({ description: 'Người hủy' })
    @IsOptional()
    @IsString()
    cancelledBy?: string;

    @ApiPropertyOptional({ description: 'Thời gian hủy' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    cancellationDate?: Date;

    @ApiPropertyOptional({ description: 'Cần hoàn tiền' })
    @IsOptional()
    @IsBoolean()
    refundRequired?: boolean;

    // General fields
    @ApiPropertyOptional({ description: 'Ghi chú' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'ID người dùng' })
    @IsOptional()
    @IsUUID('4')
    userId?: string;
}
