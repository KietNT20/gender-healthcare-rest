import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelPaymentDto {
    @ApiPropertyOptional({
        description: 'Lý do hủy thanh toán',
        example: 'Người dùng không muốn thanh toán nữa',
    })
    @IsOptional()
    @IsString()
    cancellationReason?: string;
}
