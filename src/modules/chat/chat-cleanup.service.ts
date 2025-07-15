import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatRoomCleanupService } from './chat-room-cleanup.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatCleanupService {
    private readonly logger = new Logger(ChatCleanupService.name);

    constructor(
        private readonly chatGateway: ChatGateway,
        private readonly chatRoomCleanupService: ChatRoomCleanupService,
    ) {}

    @Cron(CronExpression.EVERY_30_MINUTES)
    async cleanupExpiredChatData() {
        try {
            await this.chatGateway.cleanupExpiredData();
            this.logger.debug('Chat cleanup completed successfully');
        } catch (error) {
            this.logger.error('Error during chat cleanup:', error);
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async cleanupOfflineUsers() {
        try {
            await this.chatGateway.cleanupOfflineUsers();
            this.logger.debug('Offline users cleanup completed');
        } catch (error) {
            this.logger.error('Error during offline users cleanup:', error);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async cleanupCompletedConsultationRooms() {
        try {
            const cleanupCount =
                await this.chatRoomCleanupService.cleanupCompletedConsultationRooms();
            this.logger.log(
                `Completed consultation rooms cleanup finished. Cleaned up ${cleanupCount} rooms`,
            );
        } catch (error) {
            this.logger.error(
                'Error during completed consultation rooms cleanup:',
                error,
            );
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async cleanupCancelledConsultationRooms() {
        try {
            const cleanupCount =
                await this.chatRoomCleanupService.cleanupCancelledConsultationRooms();
            this.logger.log(
                `Cancelled consultation rooms cleanup finished. Cleaned up ${cleanupCount} rooms`,
            );
        } catch (error) {
            this.logger.error(
                'Error during cancelled consultation rooms cleanup:',
                error,
            );
        }
    }

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async archiveOldQuestions() {
        try {
            const archiveCount =
                await this.chatRoomCleanupService.archiveOldQuestions();
            this.logger.log(
                `Monthly question archival completed. Archived ${archiveCount} questions`,
            );
        } catch (error) {
            this.logger.error('Error during monthly question archival:', error);
        }
    }
}
