import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelStiAppointmentDto {
    @ApiPropertyOptional({
        description: 'Lý do hủy lịch hẹn',
        example: 'Thay đổi kế hoạch cá nhân',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Lý do hủy không được vượt quá 500 ký tự' })
    reason?: string;
}
