import {
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    @ApiOperation({
        summary: 'Get all notifications for the current user',
    })
    findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
        return this.notificationsService.findAllForUser(user.id, pagination);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notifications count' })
    getUnreadCount(@CurrentUser() user: User) {
        return this.notificationsService.getUnreadCount(user.id);
    }

    @Patch('mark-all-as-read')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ResponseMessage('All notifications marked as read.')
    markAllAsRead(@CurrentUser() user: User) {
        return this.notificationsService.markAllAsRead(user.id);
    }

    @Patch(':id/mark-as-read')
    @ApiOperation({ summary: 'Mark a notification as read' })
    @ResponseMessage('Notification marked as read.')
    markAsRead(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: User,
    ) {
        return this.notificationsService.markAsRead(id, user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a notification' })
    @ResponseMessage('Notification deleted.')
    remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
        return this.notificationsService.remove(id, user.id);
    }
}
