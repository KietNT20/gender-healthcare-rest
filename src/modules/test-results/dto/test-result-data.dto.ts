import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    Allow,
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import {
    AbnormalityLevel,
    MeasurementUnit,
    ServiceType,
} from '../enums/test-result.enums';
import { TestResultItem } from '../interfaces/test-result.interfaces';

// DTO cho một kết quả test riêng lẻ
export class TestResultItemDto
    implements Omit<TestResultItem, 'referenceRange'>
{
    @ApiProperty({ description: 'Tên chỉ số', example: 'HIV' })
    @IsString()
    @IsNotEmpty()
    parameterName: string;

    @ApiProperty({ description: 'Tên hiển thị', example: 'HIV Antibody Test' })
    @IsString()
    @IsNotEmpty()
    displayName: string;

    @ApiPropertyOptional({ description: 'Nhóm chỉ số', example: 'STI Tests' })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiProperty({
        description: 'Giá trị kết quả',
        example: 'Negative',
        oneOf: [{ type: 'string' }, { type: 'number' }],
    })
    @Allow()
    value: string | number;

    @ApiProperty({
        description: 'Đơn vị đo',
        enum: MeasurementUnit,
        example: MeasurementUnit.NEGATIVE,
    })
    @IsEnum(MeasurementUnit)
    unit: MeasurementUnit;

    @ApiPropertyOptional({
        description: 'Khoảng tham chiếu bình thường',
        example: {
            normalValues: ['Negative', 'Non-reactive'],
            description: 'Normal range for HIV antibody test',
        },
    })
    @IsOptional()
    referenceRange?: {
        min?: number;
        max?: number;
        normalValues?: string[];
        description?: string;
    };

    @ApiProperty({
        description: 'Trạng thái kết quả',
        enum: ['normal', 'abnormal', 'borderline', 'critical'],
        example: 'normal',
    })
    @IsEnum(['normal', 'abnormal', 'borderline', 'critical'])
    status: 'normal' | 'abnormal' | 'borderline' | 'critical';

    @ApiPropertyOptional({
        description: 'Mức độ bất thường',
        enum: AbnormalityLevel,
    })
    @IsEnum(AbnormalityLevel)
    @IsOptional()
    abnormalityLevel?: AbnormalityLevel;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({ description: 'Ý nghĩa lâm sàng' })
    @IsString()
    @IsOptional()
    clinicalSignificance?: string;

    @ApiPropertyOptional({ description: 'Phương pháp xét nghiệm' })
    @IsString()
    @IsOptional()
    methodUsed?: string;

    @ApiPropertyOptional({ description: 'Thiết bị sử dụng' })
    @IsString()
    @IsOptional()
    equipmentUsed?: string;

    @ApiPropertyOptional({ description: 'Kỹ thuật viên thực hiện' })
    @IsString()
    @IsOptional()
    labTechnician?: string;
}

// DTO cho thông tin mẫu
export class SampleInfoDto {
    @ApiProperty({ description: 'Loại mẫu', example: 'Blood serum' })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({ description: 'Tình trạng mẫu', example: 'Good quality' })
    @IsString()
    @IsNotEmpty()
    condition: string;

    @ApiPropertyOptional({ description: 'Thể tích mẫu', example: '5ml' })
    @IsString()
    @IsOptional()
    volume?: string;

    @ApiPropertyOptional({
        description: 'Phương pháp lấy mẫu',
        example: 'Venipuncture',
    })
    @IsString()
    @IsOptional()
    collectionMethod?: string;
}

// DTO cho thông tin phòng lab
export class LaboratoryInfoDto {
    @ApiProperty({
        description: 'Tên phòng lab',
        example: 'ABC Medical Laboratory',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Địa chỉ' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ description: 'Chứng nhận' })
    @IsString()
    @IsOptional()
    accreditation?: string;

    @ApiPropertyOptional({ description: 'Thông tin liên hệ' })
    @IsString()
    @IsOptional()
    contactInfo?: string;
}

// DTO cho quality control
export class QualityControlDto {
    @ApiProperty({ description: 'QC có pass không' })
    @IsBoolean()
    passed: boolean;

    @ApiPropertyOptional({ description: 'Các vấn đề QC' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    issues?: string[];

    @ApiPropertyOptional({ description: 'Người review' })
    @IsString()
    @IsOptional()
    reviewer?: string;
}

export class TestResultDataDto {
    @ApiProperty({
        description: 'Loại dịch vụ y tế',
        enum: ServiceType,
        example: ServiceType.STI_TEST,
    })
    @IsEnum(ServiceType)
    serviceType: ServiceType;

    @ApiProperty({
        description: 'Tên xét nghiệm',
        example: 'Bộ xét nghiệm STI cơ bản',
    })
    @IsString()
    @IsNotEmpty()
    testName: string;

    @ApiPropertyOptional({ description: 'Mã xét nghiệm nội bộ' })
    @IsString()
    @IsOptional()
    testCode?: string;

    @ApiPropertyOptional({ description: 'Thời gian lấy mẫu' })
    @IsDateString()
    @IsOptional()
    sampleCollectedAt?: string;

    @ApiPropertyOptional({ description: 'Thời gian phân tích' })
    @IsDateString()
    @IsOptional()
    analyzedAt?: string;

    @ApiPropertyOptional({ description: 'Thời gian báo cáo' })
    @IsDateString()
    @IsOptional()
    reportedAt?: string;

    @ApiPropertyOptional({ description: 'Thông tin mẫu', type: SampleInfoDto })
    @ValidateNested()
    @Type(() => SampleInfoDto)
    @IsOptional()
    sampleInfo?: SampleInfoDto;

    @ApiProperty({
        description: 'Danh sách các kết quả',
        type: [TestResultItemDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TestResultItemDto)
    results: TestResultItemDto[];

    @ApiProperty({
        description: 'Trạng thái tổng quan',
        enum: ['normal', 'abnormal', 'inconclusive', 'critical'],
        example: 'normal',
    })
    @IsEnum(['normal', 'abnormal', 'inconclusive', 'critical'])
    overallStatus: 'normal' | 'abnormal' | 'inconclusive' | 'critical';

    @ApiPropertyOptional({ description: 'Tóm tắt tổng quát' })
    @IsString()
    @IsOptional()
    summary?: string;

    @ApiPropertyOptional({ description: 'Giải thích lâm sàng' })
    @IsString()
    @IsOptional()
    clinicalInterpretation?: string;

    @ApiPropertyOptional({ description: 'Khuyến nghị' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    recommendations?: string[];

    @ApiPropertyOptional({
        description: 'Thông tin phòng lab',
        type: LaboratoryInfoDto,
    })
    @ValidateNested()
    @Type(() => LaboratoryInfoDto)
    @IsOptional()
    laboratoryInfo?: LaboratoryInfoDto;

    @ApiPropertyOptional({
        description: 'Kiểm soát chất lượng',
        type: QualityControlDto,
    })
    @ValidateNested()
    @Type(() => QualityControlDto)
    @IsOptional()
    qualityControl?: QualityControlDto;
}
