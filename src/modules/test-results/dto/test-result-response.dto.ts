import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TestResultDataDto } from './test-result-data.dto';

// Response DTO cho test result để frontend
export class TestResultResponseDto {
    @ApiProperty({ description: 'ID của test result' })
    @Expose()
    id: string;

    @ApiProperty({
        description: 'Dữ liệu kết quả xét nghiệm đã chuẩn hóa',
        type: TestResultDataDto,
    })
    @Expose()
    @Type(() => TestResultDataDto)
    resultData: TestResultDataDto;

    @ApiPropertyOptional({ description: 'Tóm tắt kết quả' })
    @Expose()
    resultSummary?: string;

    @ApiProperty({ description: 'Có bất thường không' })
    @Expose()
    isAbnormal: boolean;

    @ApiPropertyOptional({ description: 'Khuyến nghị' })
    @Expose()
    recommendation?: string;

    @ApiProperty({ description: 'Đã gửi thông báo chưa' })
    @Expose()
    notificationSent: boolean;

    @ApiProperty({ description: 'Cần theo dõi không' })
    @Expose()
    followUpRequired: boolean;

    @ApiPropertyOptional({ description: 'Ghi chú theo dõi' })
    @Expose()
    followUpNotes?: string;

    @ApiProperty({ description: 'Thời gian tạo' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Thời gian cập nhật' })
    @Expose()
    updatedAt: Date;

    @ApiPropertyOptional({ description: 'Thông tin appointment liên quan' })
    @Expose()
    appointment?: {
        id: string;
        appointmentDate: Date;
        status: string;
    };

    @ApiPropertyOptional({ description: 'Thông tin service liên quan' })
    @Expose()
    service?: {
        id: string;
        name: string;
        category: string;
    };

    @ApiPropertyOptional({ description: 'Thông tin user' })
    @Expose()
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}

// Response DTO cho template
export class TestResultTemplateResponseDto {
    @ApiProperty({ description: 'Template cho loại dịch vụ' })
    template: Partial<TestResultDataDto>;

    @ApiProperty({ description: 'Thông tin metadata' })
    metadata: {
        serviceType: string;
        version: string;
        lastUpdated: Date;
        requiredFields: string[];
        optionalFields: string[];
    };
}

// Response DTO cho validation
export class ValidationResponseDto {
    @ApiProperty({ description: 'Kết quả validation' })
    isValid: boolean;

    @ApiPropertyOptional({ description: 'Danh sách lỗi nếu có' })
    errors?: string[];

    @ApiPropertyOptional({ description: 'Cảnh báo nếu có' })
    warnings?: string[];
}

// Response DTO cho recommendations
export class RecommendationsResponseDto {
    @ApiProperty({ description: 'Danh sách khuyến nghị' })
    recommendations: string[];

    @ApiProperty({ description: 'Mức độ ưu tiên' })
    priority: 'low' | 'medium' | 'high' | 'critical';

    @ApiPropertyOptional({ description: 'Ghi chú bổ sung' })
    notes?: string;
}
