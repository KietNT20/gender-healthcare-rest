import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ArrayNotEmpty,
    IsArray,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
    ValidateIf,
} from 'class-validator';
import { ReminderFrequencyType } from 'src/enums';

export class CreateContraceptiveReminderDto {
    @ApiProperty({
        description: 'Loại thuốc hoặc phương pháp tránh thai',
    })
    @IsString()
    @IsNotEmpty()
    contraceptiveType: string;

    @ApiProperty({
        description: 'Thời gian nhắc nhở trong ngày (HH:mm)',
    })
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'Thời gian phải có định dạng HH:mm',
    })
    reminderTime: string;

    @ApiProperty({
        description: 'Ngày bắt đầu nhắc nhở (YYYY-MM-DD)',
    })
    @IsDateString()
    @IsNotEmpty()
    startDate: Date;

    @ApiPropertyOptional({
        description: 'Ngày kết thúc nhắc nhở (YYYY-MM-DD)',
    })
    @IsDateString()
    @IsOptional()
    endDate?: Date;

    @ApiProperty({
        description: 'Tần suất nhắc nhở',
        enum: ReminderFrequencyType,
        default: ReminderFrequencyType.DAILY,
    })
    @IsEnum(ReminderFrequencyType)
    frequency: ReminderFrequencyType;

    @ApiPropertyOptional({
        description:
            'Các ngày trong tuần (0=Chủ Nhật, 1=Thứ Hai, ..., 6=Thứ Bảy). Bắt buộc nếu tần suất là WEEKLY.',
        type: [Number],
    })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(0, { each: true })
    @Max(6, { each: true })
    @ValidateIf((o) => o.frequency === ReminderFrequencyType.WEEKLY)
    @ArrayNotEmpty({
        message: 'daysOfWeek không được để trống khi tần suất là WEEKLY',
    })
    daysOfWeek?: number[];

    @ApiPropertyOptional({
        description: 'Nội dung tin nhắn nhắc nhở tùy chỉnh',
    })
    @IsString()
    @IsOptional()
    reminderMessage?: string;
}
