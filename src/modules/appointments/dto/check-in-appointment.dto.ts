import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class CheckInAppointmentDto {
    @ApiPropertyOptional({
        description: 'Thời gian check-in, mặc định là thời gian hiện tại',
    })
    @IsDate()
    @IsOptional()
    checkInTime?: Date;

    @ApiPropertyOptional({
        description: 'Ghi chú từ lễ tân',
    })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({
        description: 'Danh sách services thực tế (có thể khác đặt ban đầu)',
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    actualServices?: string[];
}

export class CheckInResponseDto {
    appointmentId: string;
    checkInTime: Date;
    estimatedWaitTime: number; // Thời gian chờ dự kiến (phút)
    assignedRoom?: string; // Phòng được phân bổ
    nextSteps: string[]; // Hướng dẫn bước tiếp theo
    status: string;
}
