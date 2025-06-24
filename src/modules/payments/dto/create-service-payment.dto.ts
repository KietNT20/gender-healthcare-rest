import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateServicePaymentDto {
    @ApiProperty({
        description: 'ID của dịch vụ cần thanh toán',
        example: '550e8400-e29b-41d4-a716-446655440003',
    })
    @IsUUID('4')
    serviceId: string;

    @ApiPropertyOptional({
        description: 'Mô tả thanh toán (tùy chọn)',
        example: 'Thanh toán dịch vụ tư vấn',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description:
            'URL frontend để chuyển hướng sau khi thanh toán thành công',
        example: 'https://yourdomain.com/services/payment/success',
    })
    @IsOptional()
    @IsString()
    frontendReturnUrl?: string;

    @ApiPropertyOptional({
        description: 'URL frontend để chuyển hướng khi hủy thanh toán',
        example: 'https://yourdomain.com/services/payment/cancel',
    })
    @IsOptional()
    @IsString()
    frontendCancelUrl?: string;
}
