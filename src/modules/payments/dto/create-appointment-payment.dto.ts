import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentPaymentDto {
    @ApiProperty({
        description: 'ID của cuộc hẹn cần thanh toán',
        example: '550e8400-e29b-41d4-a716-446655440004',
    })
    @IsUUID()
    appointmentId: string;

    @ApiPropertyOptional({
        description: 'Mô tả thanh toán (tùy chọn)',
        example: 'Thanh toán cuộc hẹn tư vấn',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description:
            'URL frontend để chuyển hướng sau khi thanh toán thành công',
        example: 'https://yourdomain.com/appointments/payment/success',
    })
    @IsOptional()
    @IsString()
    frontendReturnUrl?: string;

    @ApiPropertyOptional({
        description: 'URL frontend để chuyển hướng khi hủy thanh toán',
        example: 'https://yourdomain.com/appointments/payment/cancel',
    })
    @IsOptional()
    @IsString()
    frontendCancelUrl?: string;
}
