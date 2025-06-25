import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class LateCheckInDto {
    @ApiProperty({
        description: 'Thời gian đến thực tế',
        type: Date,
    })
    @IsDate()
    @Type(() => Date)
    actualArrivalTime: Date;

    @ApiPropertyOptional({
        description: 'Dịch vụ điều chỉnh do thiếu thời gian',
        type: [String],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    adjustedServices?: string[];

    @ApiPropertyOptional({
        description: 'Ghi chú về việc đến trễ',
        example: 'Khách hàng đến trễ 20 phút do kẹt xe',
    })
    @IsString()
    @IsOptional()
    notes?: string;
}

export class LateCheckInResponseDto {
    appointmentId: string;
    actualArrivalTime: Date;
    adjustedServices: string[];
    estimatedWaitTime: number;
    status: string;
    warnings: string[];
}
