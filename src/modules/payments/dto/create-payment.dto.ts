import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiPropertyOptional({
        description: 'Mô tả thanh toán (tùy chọn)',
        example: 'Thanh toán cho gói dịch vụ hoặc cuộc hẹn',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'ID của người dùng thực hiện thanh toán',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true,
    })
    @IsUUID()
    userId: string;

    @ApiPropertyOptional({
        description: 'ID của gói dịch vụ liên quan đến thanh toán',
        example: '550e8400-e29b-41d4-a716-446655440005',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    packageId?: string;

    @ApiPropertyOptional({
        description: 'ID của cuộc hẹn liên quan đến thanh toán',
        example: '550e8400-e29b-41d4-a716-446655440004',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    appointmentId?: string;
}