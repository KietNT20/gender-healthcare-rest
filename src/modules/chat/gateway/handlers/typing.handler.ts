import { Injectable, Logger } from '@nestjs/common';
import { CHAT_EVENTS, ROOM_PATTERNS } from '../../constants/events';
import {
    AuthenticatedSocket,
    TypingData,
} from '../../core/interfaces/socket.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class TypingHandler {
    private readonly logger = new Logger(TypingHandler.name);

    constructor(private readonly redisService: RedisService) {}

    async handleTyping(
        data: TypingData,
        client: AuthenticatedSocket,
    ): Promise<void> {
        try {
            const { questionId, isTyping } = data;
            const userId = client.data.userId;
            const username = client.data.user?.firstName || 'Unknown User';

            // Validate user is in the room
            const isInRoom = await this.redisService.isUserInRoom(
                questionId,
                userId as string,
            );
            if (!isInRoom) {
                throw new Error('User is not in the room');
            }

            // Set typing status in Redis
            await this.redisService.setTypingStatus(
                questionId,
                userId as string,
                isTyping,
            );

            // Notify other users in the room
            const roomName = `${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`;
            client.to(roomName).emit(CHAT_EVENTS.TYPING_STATUS, {
                userId,
                username,
                isTyping,
                questionId,
                timestamp: new Date().toISOString(),
            });

            if (isTyping) {
                this.logger.log(
                    `User ${username} is typing in question ${questionId}`,
                );
            } else {
                this.logger.log(
                    `User ${username} stopped typing in question ${questionId}`,
                );
            }
        } catch (error) {
            this.logger.error(`Error handling typing status:`, error);
            throw error;
        }
    }

    async getTypingUsers(questionId: string): Promise<string[]> {
        return await this.redisService.getTypingUsers(questionId);
    }

    async clearTypingStatus(questionId: string, userId: string): Promise<void> {
        await this.redisService.setTypingStatus(questionId, userId, false);
    }

    async clearAllTypingStatus(questionId: string): Promise<void> {
        const typingUsers = await this.redisService.getTypingUsers(questionId);

        for (const userId of typingUsers) {
            await this.redisService.setTypingStatus(questionId, userId, false);
        }
    }
}
