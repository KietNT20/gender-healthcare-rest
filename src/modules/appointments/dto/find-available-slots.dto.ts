import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class FindAvailableSlotsDto {
    @ApiPropertyOptional({
        description:
            'Danh sách ID của các dịch vụ yêu cầu. Để trống cho tư vấn tổng quát.',
        type: [String],
        example: ['service-uuid-1', 'service-uuid-2'],
    })
    @IsOptional()
    @IsUUID('4', { each: true })
    serviceIds?: string[];

    @ApiProperty({
        description: 'Ngày bắt đầu tìm kiếm (YYYY-MM-DD)',
        example: '2025-06-25',
    })
    @IsNotEmpty()
    @IsDate()
    startDate: Date;

    @ApiPropertyOptional({
        description:
            'Ngày kết thúc tìm kiếm (YYYY-MM-DD). Mặc định là 7 ngày từ startDate',
        example: '2025-07-01',
    })
    @IsOptional()
    @IsDate()
    endDate?: Date;

    @ApiPropertyOptional({
        description: 'Giờ bắt đầu trong ngày (HH:MM). Mặc định 08:00',
        example: '08:00',
    })
    @IsOptional()
    @IsString()
    startTime?: string;

    @ApiPropertyOptional({
        description: 'Giờ kết thúc trong ngày (HH:MM). Mặc định 18:00',
        example: '18:00',
    })
    @IsOptional()
    @IsString()
    endTime?: string;

    @ApiPropertyOptional({
        description:
            'ID tư vấn viên cụ thể (nếu muốn tìm slot cho tư vấn viên này)',
    })
    @IsOptional()
    @IsString()
    consultantId?: string;
}

export class AvailableSlotDto {
    @ApiProperty({ description: 'Ngày và giờ của slot' })
    @IsNotEmpty()
    @IsDate()
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
    @IsNotEmpty()
    @IsUUID('4')
    availabilityId: string;

    @ApiProperty({ description: 'Số slot còn trống' })
    @IsNotEmpty()
    @IsNumber()
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
