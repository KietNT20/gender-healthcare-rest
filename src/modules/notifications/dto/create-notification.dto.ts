import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { PriorityType } from 'src/enums';

export class CreateNotificationDto {
    @ApiProperty({
        description: 'User ID getting the notification',
    })
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({
        description: 'Notification title',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: 'Notification content',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        description: 'Notification type',
    })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiPropertyOptional({
        description: 'Action URL when clicking on the notification',
    })
    @IsString()
    @IsOptional()
    actionUrl?: string;

    @ApiPropertyOptional({
        description: 'Notification priority level',
        enum: PriorityType,
    })
    @IsEnum(PriorityType)
    @IsOptional()
    priority?: PriorityType;
}
