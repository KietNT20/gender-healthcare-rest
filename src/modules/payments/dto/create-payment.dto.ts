import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Validate } from 'class-validator';

export class AtLeastOneIdValidator {
    static validate(value: any, args: any): boolean {
        const { packageId, appointmentId, serviceId } = args.object;
        return !!(packageId || appointmentId || serviceId); // Đảm bảo ít nhất một trong ba được cung cấp
    }

    static defaultMessage(): string {
        return 'Phải cung cấp ít nhất một trong packageId, appointmentId hoặc serviceId';
    }
}

export class CreatePaymentDto {
    @ApiPropertyOptional({
        description: 'Mô tả thanh toán (tùy chọn)',
        example: 'Thanh toán cho gói dịch vụ hoặc cuộc hẹn',
    })
    @IsOptional()
    @IsString()
    description?: string;

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

    @ApiPropertyOptional({
        description: 'ID của dịch vụ cần thanh toán',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    serviceId?: string;

    @Validate(AtLeastOneIdValidator, {
        message:
            'Phải cung cấp ít nhất một trong packageId, appointmentId hoặc serviceId',
    })
    atLeastOneId?: boolean;
}
