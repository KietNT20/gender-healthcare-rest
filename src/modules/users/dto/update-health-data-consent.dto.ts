import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateHealthDataConsentDto {
    @ApiProperty({
        description: 'Đồng ý cho phép thu thập và xử lý dữ liệu sức khỏe',
        example: true,
    })
    @IsNotEmpty({ message: 'Trạng thái đồng ý là bắt buộc' })
    @IsBoolean({ message: 'Trạng thái đồng ý phải là true hoặc false' })
    healthDataConsent: boolean;
}
