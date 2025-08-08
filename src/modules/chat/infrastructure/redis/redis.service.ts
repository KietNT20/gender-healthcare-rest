import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { REDIS_KEYS, TTL_VALUES } from '../../constants/redis-keys';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: RedisClientType;

    constructor(private readonly configService: ConfigService) {
        void this.initializeClient();
    }

    private async initializeClient() {
        const host = this.configService.get('REDIS_HOST');
        const port = +this.configService.get('REDIS_PORT');

        this.client = createClient({
            socket: {
                host,
                port,
            },
        });

        this.client.on('error', (err) => {
            this.logger.error('Redis Client Error:', err);
        });

        this.client.on('connect', () => {
            this.logger.log('Redis Client Connected');
        });

        this.client.on('ready', () => {
            this.logger.log('Redis Client Ready');
        });

        this.client.on('reconnecting', () => {
            this.logger.log('Redis Client Reconnecting...');
        });

        this.client.on('end', () => {
            this.logger.log('Redis Client Connection Ended');
        });

        try {
            await this.client.connect();
            this.logger.log('✅ Successfully connected to Redis');
        } catch (error) {
            this.logger.error('❌ Failed to connect to Redis:', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
        }
    }

    getClient(): RedisClientType {
        return this.client;
    }

    // User Presence Management
    async setUserPresence(userId: string, isOnline: boolean): Promise<void> {
        const key = `${REDIS_KEYS.USER_PRESENCE}${userId}`;
        const value = JSON.stringify({
            isOnline,
            lastSeen: new Date().toISOString(),
        });

        await this.client.setEx(key, TTL_VALUES.USER_PRESENCE, value);
    }

    async getUserPresence(
        userId: string,
    ): Promise<{ isOnline: boolean; lastSeen: string } | null> {
        const key = `${REDIS_KEYS.USER_PRESENCE}${userId}`;
        const value = await this.client.get(key);

        if (!value) return null;

        return JSON.parse(value) as { isOnline: boolean; lastSeen: string };
    }

    async removeUserPresence(userId: string): Promise<void> {
        const key = `${REDIS_KEYS.USER_PRESENCE}${userId}`;
        await this.client.del(key);
    }

    // Room Management
    async addUserToRoom(questionId: string, userId: string): Promise<void> {
        const key = `${REDIS_KEYS.QUESTION_USERS}${questionId}`;
        await this.client.sAdd(key, userId);
        await this.client.expire(key, TTL_VALUES.QUESTION_USERS);
    }

    async removeUserFromRoom(
        questionId: string,
        userId: string,
    ): Promise<void> {
        const key = `${REDIS_KEYS.QUESTION_USERS}${questionId}`;
        await this.client.sRem(key, userId);
    }

    async getRoomUsers(questionId: string): Promise<string[]> {
        const key = `${REDIS_KEYS.QUESTION_USERS}${questionId}`;
        return await this.client.sMembers(key);
    }

    async isUserInRoom(questionId: string, userId: string): Promise<boolean> {
        const key = `${REDIS_KEYS.QUESTION_USERS}${questionId}`;
        return await this.client.sIsMember(key, userId);
    }

    // User Rooms Management
    async addUserRoom(userId: string, questionId: string): Promise<void> {
        const key = `${REDIS_KEYS.USER_ROOMS}${userId}`;
        await this.client.sAdd(key, questionId);
        await this.client.expire(key, TTL_VALUES.USER_ROOMS);
    }

    async removeUserRoom(userId: string, questionId: string): Promise<void> {
        const key = `${REDIS_KEYS.USER_ROOMS}${userId}`;
        await this.client.sRem(key, questionId);
    }

    async getUserRooms(userId: string): Promise<string[]> {
        const key = `${REDIS_KEYS.USER_ROOMS}${userId}`;
        return await this.client.sMembers(key);
    }

    // Typing Status Management
    async setTypingStatus(
        questionId: string,
        userId: string,
        isTyping: boolean,
    ): Promise<void> {
        const key = `${REDIS_KEYS.TYPING_USERS}${questionId}`;

        if (isTyping) {
            await this.client.hSet(
                key,
                userId,
                JSON.stringify({
                    isTyping: true,
                    timestamp: new Date().toISOString(),
                }),
            );
        } else {
            await this.client.hDel(key, userId);
        }

        await this.client.expire(key, TTL_VALUES.TYPING_STATUS);
    }

    async getTypingUsers(questionId: string): Promise<string[]> {
        const key = `${REDIS_KEYS.TYPING_USERS}${questionId}`;
        const typingData = await this.client.hGetAll(key);

        return Object.keys(typingData).filter((userId) => {
            try {
                const data = JSON.parse(typingData[userId]);
                return data.isTyping;
            } catch {
                return false;
            }
        });
    }

    // Cleanup expired data
    cleanupExpiredData(): void {
        // This will be handled by Redis TTL automatically
        this.logger.log('Redis cleanup completed');
    }
}
