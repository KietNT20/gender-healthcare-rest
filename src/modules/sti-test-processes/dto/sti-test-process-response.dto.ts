import { ApiProperty } from '@nestjs/swagger';
import { ProcessPriority, StiSampleType, StiTestProcessStatus } from '../enums';

export class StiTestProcessResponseDto {
    @ApiProperty({ description: 'ID của quá trình xét nghiệm' })
    id: string;

    @ApiProperty({ description: 'Mã số xét nghiệm' })
    testCode: string;

    @ApiProperty({
        description: 'Trạng thái quá trình',
        enum: StiTestProcessStatus,
    })
    status: StiTestProcessStatus;

    @ApiProperty({
        description: 'Loại mẫu',
        enum: StiSampleType,
    })
    sampleType: StiSampleType;

    @ApiProperty({
        description: 'Độ ưu tiên',
        enum: ProcessPriority,
    })
    priority: ProcessPriority;

    @ApiProperty({
        description: 'Thời gian dự kiến có kết quả',
        nullable: true,
    })
    estimatedResultDate?: Date;

    @ApiProperty({
        description: 'Thời gian thực tế có kết quả',
        nullable: true,
    })
    actualResultDate?: Date;

    @ApiProperty({ description: 'Thời gian lấy mẫu', nullable: true })
    sampleCollectionDate?: Date;

    @ApiProperty({ description: 'Địa điểm lấy mẫu', nullable: true })
    sampleCollectionLocation?: string;

    @ApiProperty({ description: 'Ghi chú quá trình', nullable: true })
    processNotes?: string;

    @ApiProperty({ description: 'Ghi chú từ lab', nullable: true })
    labNotes?: string;

    @ApiProperty({ description: 'Người lấy mẫu', nullable: true })
    sampleCollectedBy?: string;

    @ApiProperty({ description: 'Lab xử lý', nullable: true })
    labProcessedBy?: string;

    @ApiProperty({ description: 'Yêu cầu tư vấn' })
    requiresConsultation: boolean;

    @ApiProperty({ description: 'Đã thông báo bệnh nhân' })
    patientNotified: boolean;

    @ApiProperty({ description: 'Đã gửi email kết quả' })
    resultEmailSent: boolean;

    @ApiProperty({ description: 'Bảo mật' })
    isConfidential: boolean;

    @ApiProperty({ description: 'Ngày tạo' })
    createdAt: Date;

    @ApiProperty({ description: 'Ngày cập nhật' })
    updatedAt: Date;

    @ApiProperty({ description: 'Thông tin bệnh nhân', nullable: true })
    patient?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };

    @ApiProperty({ description: 'Thông tin dịch vụ', nullable: true })
    service?: {
        id: string;
        name: string;
        description: string;
        price: number;
    };

    @ApiProperty({ description: 'Thông tin cuộc hẹn', nullable: true })
    appointment?: {
        id: string;
        appointmentDate: Date;
        status: string;
    };

    @ApiProperty({
        description: 'Thông tin kết quả xét nghiệm',
        nullable: true,
    })
    testResult?: {
        id: string;
        resultSummary?: string;
        isAbnormal: boolean;
        createdAt: Date;
    };

    @ApiProperty({ description: 'Thông tin bác sĩ tư vấn', nullable: true })
    consultantDoctor?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}
