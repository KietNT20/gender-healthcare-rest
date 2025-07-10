import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDate,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { IsAfterNow } from 'src/decorators/is-after-now.decorator';
import { LocationTypeEnum } from 'src/enums';

export class CreateStiAppointmentDto {
    @ApiProperty({
        description: 'ID của dịch vụ xét nghiệm STI',
        type: String,
        example: 'service-uuid-123',
    })
    @IsUUID('4')
    @IsNotEmpty()
    stiServiceId: string;

    @ApiPropertyOptional({
        description: 'ID của tư vấn viên (nếu cần tư vấn)',
        example: 'consultant-uuid-123',
    })
    @IsUUID('4')
    @IsOptional()
    consultantId?: string;

    @ApiProperty({
        description: 'Ngày và giờ lấy mẫu xét nghiệm (ISO 8601)',
        example: '2025-12-10T09:00:00.000Z',
    })
    @IsDate()
    @IsAfterNow({
        message: 'Thời gian lấy mẫu phải là một thời điểm trong tương lai.',
    })
    @IsNotEmpty()
    sampleCollectionDate: Date;

    @ApiProperty({
        description:
            'Địa điểm lấy mẫu xét nghiệm (chỉ tại văn phòng/phòng khám)',
        enum: LocationTypeEnum,
        example: LocationTypeEnum.OFFICE,
    })
    @IsEnum(LocationTypeEnum)
    @IsNotEmpty()
    sampleCollectionLocation: LocationTypeEnum;

    @ApiPropertyOptional({
        description: 'Ghi chú thêm từ khách hàng',
        example: 'Khách hàng muốn lấy mẫu vào buổi sáng',
    })
    @IsString()
    @IsOptional()
    notes?: string;
}
