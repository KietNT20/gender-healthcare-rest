import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatCleanupService {
    private readonly logger = new Logger(ChatCleanupService.name);

    constructor(private readonly chatGateway: ChatGateway) {}

    @Cron(CronExpression.EVERY_10_MINUTES)
    async cleanupExpiredChatData() {
        try {
            await this.chatGateway.cleanupExpiredData();
            this.logger.debug('Chat cleanup completed successfully');
        } catch (error) {
            this.logger.error('Error during chat cleanup:', error);
        }
    }

    @Cron(CronExpression.EVERY_YEAR)
    async cleanupOfflineUsers() {
        try {
            // Additional cleanup logic if needed
            this.logger.debug('Offline users cleanup completed');
        } catch (error) {
            this.logger.error('Error during offline users cleanup:', error);
        }
    }
}
