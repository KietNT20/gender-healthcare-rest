import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ArrayMinSize,
    IsArray,
    IsDate,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { IsAfterNow } from 'src/decorators/is-after-now.decorator';
import { LocationTypeEnum } from 'src/enums';

export class CreateAppointmentDto {
    @ApiProperty({
        description: 'Mảng các ID của dịch vụ mà người dùng muốn đặt.',
        type: [String],
        example: ['service-uuid-1', 'service-uuid-2'],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    @IsNotEmpty()
    serviceIds: string[];

    @ApiPropertyOptional({
        description:
            'ID của tư vấn viên. Bắt buộc cho dịch vụ tư vấn, không cần thiết cho dịch vụ khác.',
        example: 'consultant-uuid-123',
    })
    @IsUUID('4')
    @IsOptional()
    consultantId?: string;

    @ApiProperty({
        description: 'Ngày và giờ bắt đầu cuộc hẹn (ISO 8601).',
        example: '2025-12-10T09:00:00.000Z',
    })
    @IsDate()
    @IsAfterNow({
        message: 'Thời gian đặt hẹn phải là một thời điểm trong tương lai.',
    })
    @IsNotEmpty()
    appointmentDate: Date;

    @ApiProperty({
        description: 'Địa điểm thực hiện cuộc hẹn (Online hoặc tại văn phòng).',
        enum: LocationTypeEnum,
    })
    @IsEnum(LocationTypeEnum)
    @IsNotEmpty()
    appointmentLocation: LocationTypeEnum;

    @ApiPropertyOptional({ description: 'Ghi chú thêm từ người dùng.' })
    @IsString()
    @IsOptional()
    notes?: string;
}
