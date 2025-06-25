import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class MarkNoShowDto {
    @ApiProperty({
        description: 'Lý do đánh dấu no-show',
        example:
            'Khách hàng không đến theo lịch hẹn và không thể liên lạc được',
    })
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiPropertyOptional({
        description: 'Số lần đã cố gắng liên hệ',
        example: 3,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    contactAttempts?: number;

    @ApiPropertyOptional({
        description: 'Ghi chú thêm',
        example: 'Đã gọi điện 3 lần nhưng không nghe máy',
    })
    @IsString()
    @IsOptional()
    notes?: string;
}

export class NoShowProcessResult {
    appointmentId: string;
    reason: string;
    notificationSent: boolean;
    status: string;
}
