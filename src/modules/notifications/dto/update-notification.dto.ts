import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
    @ApiPropertyOptional({
        description: 'Indicates if the notification has been read',
    })
    @IsBoolean()
    @IsOptional()
    isRead?: boolean;
}
