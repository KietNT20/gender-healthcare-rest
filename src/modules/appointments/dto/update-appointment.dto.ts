import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AppointmentStatusType } from 'src/enums';

export class UpdateAppointmentDto {
    @ApiPropertyOptional({
        description:
            'Cập nhật trạng thái của cuộc hẹn (chỉ dành cho Tư vấn viên/Admin).',
        enum: [
            AppointmentStatusType.CONFIRMED,
            AppointmentStatusType.COMPLETED,
            AppointmentStatusType.NO_SHOW,
        ],
    })
    @IsEnum(AppointmentStatusType)
    @IsOptional()
    status?: AppointmentStatusType;

    @ApiPropertyOptional({ description: 'Link phòng họp cho tư vấn online.' })
    @IsString()
    @IsOptional()
    meetingLink?: string;
}

export class CancelAppointmentDto {
    @ApiPropertyOptional({ description: 'Lý do hủy lịch hẹn.' })
    @IsString()
    @IsNotEmpty()
    cancellationReason: string;
}
