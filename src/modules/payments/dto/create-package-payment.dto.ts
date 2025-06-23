import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePackagePaymentDto {
    @ApiProperty({
        description: 'ID của gói dịch vụ cần thanh toán',
        example: '550e8400-e29b-41d4-a716-446655440005',
    })
    @IsUUID()
    packageId: string;

    @ApiPropertyOptional({
        description: 'Mô tả thanh toán (tùy chọn)',
        example: 'Thanh toán gói dịch vụ Premium',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description:
            'URL frontend để chuyển hướng sau khi thanh toán thành công',
        example: 'https://yourdomain.com/payment/success',
    })
    @IsOptional()
    @IsString()
    frontendReturnUrl?: string;

    @ApiPropertyOptional({
        description: 'URL frontend để chuyển hướng khi hủy thanh toán',
        example: 'https://yourdomain.com/payment/cancel',
    })
    @IsOptional()
    @IsString()
    frontendCancelUrl?: string;
}
