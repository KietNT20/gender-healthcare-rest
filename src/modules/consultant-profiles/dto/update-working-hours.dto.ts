import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { REGEX } from 'src/constant';

export class DayWorkingHoursDto {
    @ApiProperty({
        description: 'Thời gian bắt đầu làm việc trong ngày',
    })
    @IsNotEmpty()
    @IsString()
    @Matches(REGEX.TIME_24H, {
        message: 'startTime phải có định dạng HH:mm (ví dụ: 09:00)',
    })
    startTime: string;

    @ApiProperty({
        description: 'Thời gian kết thúc làm việc trong ngày',
    })
    @IsNotEmpty()
    @IsString()
    @Matches(REGEX.TIME_24H, {
        message: 'endTime phải có định dạng HH:mm (ví dụ: 17:00)',
    })
    endTime: string;

    @ApiProperty({
        description: 'Trạng thái khả dụng của consultant trong ngày',
    })
    @IsBoolean()
    isAvailable: boolean;

    @ApiPropertyOptional({
        description: 'Số lượng cuộc hẹn tối đa trong ngày',
        default: 1,
        minimum: 1,
        maximum: 20,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(20)
    maxAppointments?: number;
}

export class WorkingHoursDto {
    @ApiPropertyOptional({
        type: [DayWorkingHoursDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DayWorkingHoursDto)
    monday?: DayWorkingHoursDto[];

    @ApiPropertyOptional({
        type: [DayWorkingHoursDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DayWorkingHoursDto)
    tuesday?: DayWorkingHoursDto[];

    @ApiPropertyOptional({
        type: [DayWorkingHoursDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DayWorkingHoursDto)
    wednesday?: DayWorkingHoursDto[];

    @ApiPropertyOptional({
        type: [DayWorkingHoursDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DayWorkingHoursDto)
    thursday?: DayWorkingHoursDto[];

    @ApiPropertyOptional({
        type: [DayWorkingHoursDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DayWorkingHoursDto)
    friday?: DayWorkingHoursDto[];

    @ApiPropertyOptional({
        type: [DayWorkingHoursDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DayWorkingHoursDto)
    saturday?: DayWorkingHoursDto[];

    @ApiPropertyOptional({
        type: [DayWorkingHoursDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DayWorkingHoursDto)
    sunday?: DayWorkingHoursDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    timezone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateWorkingHoursDto {
    @ApiProperty({
        description: 'Thông tin giờ làm việc của consultant',
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => WorkingHoursDto)
    workingHours: WorkingHoursDto;

    @ApiPropertyOptional({
        description: 'Số tuần để tự động tạo lịch khả dụng',
        default: 4,
        minimum: 1,
        maximum: 12,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    weeksToGenerate?: number = 4;
}
