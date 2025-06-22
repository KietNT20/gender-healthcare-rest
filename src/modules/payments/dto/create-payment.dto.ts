import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiProperty({
        description: 'Mô tả thanh toán (tùy chọn)',
        example: 'Thanh toán cho cuộc hẹn tư vấn',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    // @ApiProperty({
    //     description: 'ID của người dùng thực hiện thanh toán',
    //     example: '550e8400-e29b-41d4-a716-446655440000',
    //     required: true,
    // })
    // @IsUUID()
    // userId: string;

    @ApiProperty({
        description: 'ID của cuộc hẹn liên quan đến thanh toán',
        example: '550e8400-e29b-41d4-a716-446655440004',
        required: true,
    })
    @IsUUID()
    appointmentId: string;
}