import {
    IsUUID,
    IsOptional,
    IsString,
    IsArray,
    IsEnum,
    IsDate,
    IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatusType, LocationTypeEnum } from 'src/enums';

export class CreateAppointmentDto {
    @ApiProperty({
        description: 'Ngày và giờ diễn ra cuộc hẹn',
        example: '2025-06-20T10:00:00Z',
        required: true,
    })
    @IsDate()
    @Type(() => Date)
    appointmentDate: Date;

    @ApiProperty({
        description: 'Trạng thái của cuộc hẹn',
        enum: AppointmentStatusType,
        example: AppointmentStatusType.PENDING,
        required: false,
    })
    @IsEnum(AppointmentStatusType)
    @IsOptional()
    status?: AppointmentStatusType;

    @ApiProperty({
        description: 'Ghi chú về cuộc hẹn',
        example: 'Cuộc hẹn tư vấn sức khỏe',
        required: false,
    })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({
        description: 'Link họp trực tuyến (nếu có)',
        example: 'https://zoom.us/j/123456789',
        required: false,
    })
    @IsString()
    @IsOptional()
    meetingLink?: string;

    @ApiProperty({
        description: 'ID của người dùng đặt cuộc hẹn',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true,
    })
    @IsUUID()
    @IsNotEmpty({ message: 'userId is required' })
    userId: string;

    @ApiProperty({
        description: 'ID của cố vấn cho cuộc hẹn',
        example: '550e8400-e29b-41d4-a716-446655440001',
        required: true,
    })
    @IsUUID()
    @IsNotEmpty({ message: 'consultantId is required' })
    consultantId: string;

    @ApiProperty({
        description: 'Danh sách ID các dịch vụ được chọn',
        example: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
        required: false,
    })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    services?: string[];

    @ApiProperty({
        description: 'Địa điểm diễn ra cuộc hẹn',
        enum: LocationTypeEnum,
        example: LocationTypeEnum.OFFICE,
        required: false,
    })
    @IsEnum(LocationTypeEnum)
    @IsOptional()
    appointmentLocation?: LocationTypeEnum;
}