import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelStiAppointmentDto {
    @ApiPropertyOptional({
        description: 'Lý do hủy lịch hẹn',
        example: 'Thay đổi kế hoạch cá nhân',
    })
    @IsString()
    @IsOptional()
    reason?: string;
}
