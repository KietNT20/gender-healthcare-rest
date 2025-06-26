import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDate,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
} from 'class-validator';
import { LocationTypeEnum } from 'src/enums';

export class CreateConsultantAvailabilityDto {
    @ApiProperty({
        description: 'Ngày trong tuần (0=Chủ Nhật, 1=Thứ Hai, ..., 6=Thứ Bảy)',
    })
    @IsInt()
    @IsNotEmpty()
    @Min(0)
    @Max(6)
    dayOfWeek: number;

    @ApiProperty({ description: 'Thời gian bắt đầu (HH:mm)' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Thời gian bắt đầu phải có định dạng HH:mm',
    })
    startTime: string;

    @ApiProperty({
        description: 'Thời gian kết thúc (HH:mm)',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Thời gian kết thúc phải có định dạng HH:mm',
    })
    endTime: string;

    @ApiPropertyOptional({
        description: 'Địa điểm làm việc',
        enum: LocationTypeEnum,
    })
    @IsOptional()
    @IsEnum(LocationTypeEnum)
    location?: LocationTypeEnum;

    @ApiPropertyOptional({
        description: 'Lịch có lặp lại hàng tuần không?',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    recurring?: boolean = true;

    @ApiPropertyOptional({
        description: 'Ngày cụ thể cho lịch làm việc không lặp lại (YYYY-MM-DD)',
    })
    @IsOptional()
    @IsDate()
    specificDate?: Date;

    @ApiPropertyOptional({
        description: 'Số lượng cuộc hẹn tối đa trong khung giờ này',
        default: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    maxAppointments?: number = 1;
}
