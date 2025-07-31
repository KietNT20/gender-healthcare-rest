import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatRoomCleanupService } from './chat-room-cleanup.service';

@Injectable()
export class ChatCleanupSchedulerService {
    private readonly logger = new Logger(ChatCleanupSchedulerService.name);

    constructor(
        private readonly chatRoomCleanupService: ChatRoomCleanupService,
    ) {}

    /**
     * Run chat room cleanup every day at 2:00 AM
     * This will clean up chat rooms older than 2 days
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleChatRoomCleanup(): Promise<void> {
        this.logger.log('🕐 Starting scheduled chat room cleanup...');

        try {
            // Clean up all chat rooms older than 2 days
            const result =
                await this.chatRoomCleanupService.cleanupOldChatRooms(2);
            this.logger.log(
                `✅ Cleaned up ${result.redisCleanupCount} Redis rooms`,
            );
            this.logger.log(
                `📦 Archived ${result.archivedQuestionsCount} questions`,
            );

            // Clean up standalone questions older than 2 days
            const standaloneCount =
                await this.chatRoomCleanupService.cleanupStandaloneQuestions(2);
            this.logger.log(
                `✅ Cleaned up ${standaloneCount} standalone questions`,
            );

            this.logger.log(
                '🎉 Scheduled chat room cleanup completed successfully!',
            );
        } catch (error) {
            this.logger.error(
                '❌ Error during scheduled chat room cleanup:',
                error,
            );
        }
    }

    /**
     * Run completed consultation cleanup every day at 3:00 AM
     * This will clean up completed consultations older than 30 days
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async handleCompletedConsultationCleanup(): Promise<void> {
        this.logger.log(
            '🕐 Starting scheduled completed consultation cleanup...',
        );

        try {
            const cleanupCount =
                await this.chatRoomCleanupService.cleanupCompletedConsultationRooms();
            this.logger.log(
                `✅ Cleaned up ${cleanupCount} completed consultation rooms`,
            );
        } catch (error) {
            this.logger.error(
                '❌ Error during completed consultation cleanup:',
                error,
            );
        }
    }

    /**
     * Run cancelled consultation cleanup every day at 4:00 AM
     * This will clean up cancelled consultations older than 7 days
     */
    @Cron(CronExpression.EVERY_DAY_AT_4AM)
    async handleCancelledConsultationCleanup(): Promise<void> {
        this.logger.log(
            '🕐 Starting scheduled cancelled consultation cleanup...',
        );

        try {
            const cleanupCount =
                await this.chatRoomCleanupService.cleanupCancelledConsultationRooms();
            this.logger.log(
                `✅ Cleaned up ${cleanupCount} cancelled consultation rooms`,
            );
        } catch (error) {
            this.logger.error(
                '❌ Error during cancelled consultation cleanup:',
                error,
            );
        }
    }

    /**
     * Run question archival every week on Sunday at 1:00 AM
     * This will archive questions older than 6 months
     */
    @Cron('0 1 * * 0') // Every Sunday at 1:00 AM
    async handleQuestionArchival(): Promise<void> {
        this.logger.log('🕐 Starting scheduled question archival...');

        try {
            const archiveCount =
                await this.chatRoomCleanupService.archiveOldQuestions();
            this.logger.log(`📦 Archived ${archiveCount} old questions`);
        } catch (error) {
            this.logger.error('❌ Error during question archival:', error);
        }
    }

    /**
     * Manual cleanup method that can be called programmatically
     */
    async runManualCleanup(daysOld: number = 2): Promise<{
        redisCleanupCount: number;
        archivedQuestionsCount: number;
        standaloneQuestionsCount: number;
    }> {
        this.logger.log(
            `🔄 Running manual cleanup for rooms older than ${daysOld} days...`,
        );

        try {
            const result =
                await this.chatRoomCleanupService.cleanupOldChatRooms(daysOld);
            const standaloneCount =
                await this.chatRoomCleanupService.cleanupStandaloneQuestions(
                    daysOld,
                );

            this.logger.log(`✅ Manual cleanup completed:`);
            this.logger.log(
                `   - Cleaned up ${result.redisCleanupCount} Redis rooms`,
            );
            this.logger.log(
                `   - Archived ${result.archivedQuestionsCount} questions`,
            );
            this.logger.log(
                `   - Cleaned up ${standaloneCount} standalone questions`,
            );

            return {
                redisCleanupCount: result.redisCleanupCount,
                archivedQuestionsCount: result.archivedQuestionsCount,
                standaloneQuestionsCount: standaloneCount,
            };
        } catch (error) {
            this.logger.error('❌ Error during manual cleanup:', error);
            throw error;
        }
    }
}
