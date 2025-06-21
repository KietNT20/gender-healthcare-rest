import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { Server } from 'socket.io';
import {
    CHAT_EVENTS,
    REDIS_KEYS,
    ROOM_PATTERNS,
    TTL_VALUES,
} from '../constants/chat.constants';
import { AuthenticatedSocket, TypingData } from '../interfaces/chat.interface';

@Injectable()
export class TypingHandler {
    private readonly logger = new Logger(TypingHandler.name);

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    ) {}

    async handleTyping(
        data: TypingData,
        client: AuthenticatedSocket,
        server: Server,
    ) {
        if (!client.user) return;

        const { questionId, isTyping } = data;
        const userId = client.user.id;

        try {
            const typingKey = `${REDIS_KEYS.TYPING_USERS}${questionId}`;

            if (isTyping) {
                await this.redisClient.sAdd(typingKey, userId);
                await this.redisClient.expire(
                    typingKey,
                    TTL_VALUES.TYPING_STATUS,
                );
                await this.redisClient.setEx(
                    `${typingKey}:${userId}`,
                    TTL_VALUES.INDIVIDUAL_TYPING,
                    '1',
                );
            } else {
                await this.redisClient.sRem(typingKey, userId);
                await this.redisClient.del(`${typingKey}:${userId}`);
            }

            const typingUsers = await this.redisClient.sMembers(typingKey);

            server
                .to(`${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`)
                .emit(CHAT_EVENTS.TYPING_STATUS, {
                    questionId,
                    typingUserIds: typingUsers.filter((id) => id !== userId),
                    timestamp: new Date().toISOString(),
                });
        } catch (error) {
            this.logger.error('Error handling typing status:', error);
        }
    }

    async getTypingUsers(questionId: string): Promise<string[]> {
        try {
            return await this.redisClient.sMembers(
                `${REDIS_KEYS.TYPING_USERS}${questionId}`,
            );
        } catch (error) {
            this.logger.error('Error getting typing users:', error);
            return [];
        }
    }

    async removeUserFromTyping(questionId: string, userId: string) {
        try {
            const typingKey = `${REDIS_KEYS.TYPING_USERS}${questionId}`;
            await this.redisClient.sRem(typingKey, userId);
            await this.redisClient.del(`${typingKey}:${userId}`);
        } catch (error) {
            this.logger.error('Error removing user from typing:', error);
        }
    }

    // Cleanup method - call this periodically via cron
    async cleanupExpiredData() {
        try {
            const pattern = `${REDIS_KEYS.TYPING_USERS}*`;
            const keys = await this.redisClient.keys(pattern);

            const multi = this.redisClient.multi();

            for (const key of keys) {
                if (key.includes(':')) continue; // Skip individual typing keys

                const members = await this.redisClient.sMembers(key);

                // Check each typing user
                for (const userId of members) {
                    const individualKey = `${key}:${userId}`;
                    const exists = await this.redisClient.exists(individualKey);

                    if (!exists) {
                        multi.sRem(key, userId);
                    }
                }
            }

            await multi.exec();
        } catch (error) {
            this.logger.error('Error cleaning up expired data:', error);
        }
    }
}
