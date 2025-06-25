import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsUUID,
} from 'class-validator';

export class FindAvailableSlotsDto {
    @ApiProperty({
        description: 'Danh sách ID của các dịch vụ yêu cầu',
        type: [String],
        example: ['service-uuid-1', 'service-uuid-2'],
        isArray: true,
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsNotEmpty()
    serviceIds: string[];

    @ApiProperty({
        description: 'Ngày bắt đầu tìm kiếm (YYYY-MM-DD)',
        example: '2025-06-25',
    })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiPropertyOptional({
        description:
            'Ngày kết thúc tìm kiếm (YYYY-MM-DD). Mặc định là 7 ngày từ startDate',
        example: '2025-07-01',
    })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'Giờ bắt đầu trong ngày (HH:MM). Mặc định 08:00',
        example: '08:00',
    })
    @IsOptional()
    startTime?: string;

    @ApiPropertyOptional({
        description: 'Giờ kết thúc trong ngày (HH:MM). Mặc định 18:00',
        example: '18:00',
    })
    @IsOptional()
    endTime?: string;

    @ApiPropertyOptional({
        description:
            'ID tư vấn viên cụ thể (nếu muốn tìm slot cho tư vấn viên này)',
        example: 'consultant-uuid',
    })
    @IsUUID('4')
    @IsOptional()
    consultantId?: string;
}

export class AvailableSlotDto {
    @ApiProperty({ description: 'Ngày và giờ của slot' })
    dateTime: Date;

    @ApiProperty({ description: 'Thông tin tư vấn viên' })
    consultant: {
        id: string;
        firstName: string;
        lastName: string;
        specialties: string[];
        rating: number;
        consultationFee: number;
    };

    @ApiProperty({ description: 'ID của availability slot' })
    availabilityId: string;

    @ApiProperty({ description: 'Số slot còn trống' })
    remainingSlots: number;
}

export class FindAvailableSlotsResponseDto {
    @ApiProperty({
        description: 'Danh sách các slot khả dụng',
        type: [AvailableSlotDto],
    })
    availableSlots: AvailableSlotDto[];

    @ApiProperty({ description: 'Tổng số slot tìm thấy' })
    totalSlots: number;

    @ApiProperty({ description: 'Tổng số tư vấn viên có slot khả dụng' })
    totalConsultants: number;

    @ApiPropertyOptional({ description: 'Thông báo bổ sung (nếu có)' })
    message?: string;
}
