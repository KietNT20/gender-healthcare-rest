import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDate,
    IsEnum,
    IsOptional,
    IsString,
    Length,
} from 'class-validator';
import { StiTestProcessStatus } from '../entities/sti-test-process.entity';
import { CreateStiTestProcessDto } from './create-sti-test-process.dto';

export class UpdateStiTestProcessDto extends PartialType(
    CreateStiTestProcessDto,
) {
    @ApiPropertyOptional({
        description: 'Trạng thái quá trình xét nghiệm',
        enum: StiTestProcessStatus,
        example: StiTestProcessStatus.PROCESSING,
    })
    @IsOptional()
    @IsEnum(StiTestProcessStatus)
    status?: StiTestProcessStatus;

    @ApiPropertyOptional({
        description: 'Thời gian thực tế có kết quả',
        example: '2024-12-25T15:00:00Z',
    })
    @IsOptional()
    @IsDate()
    actualResultDate?: Date;

    @ApiPropertyOptional({
        description: 'Thời gian lấy mẫu',
        example: '2024-12-20T09:00:00Z',
    })
    @IsOptional()
    @IsDate()
    sampleCollectionDate?: Date;

    @ApiPropertyOptional({
        description: 'Ghi chú từ phòng lab',
        example: 'Mẫu đạt chất lượng, quá trình xử lý bình thường',
    })
    @IsOptional()
    @IsString()
    labNotes?: string;

    @ApiPropertyOptional({
        description: 'Người lấy mẫu',
        example: 'Y tá Nguyễn Văn A',
    })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    sampleCollectedBy?: string;

    @ApiPropertyOptional({
        description: 'Phòng lab xử lý',
        example: 'Lab XYZ - Kỹ thuật viên B',
    })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    labProcessedBy?: string;

    @ApiPropertyOptional({
        description: 'Đã thông báo cho bệnh nhân',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    patientNotified?: boolean;

    @ApiPropertyOptional({
        description: 'Đã gửi email kết quả',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    resultEmailSent?: boolean;
}
