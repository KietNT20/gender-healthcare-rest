import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisHelperService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisHelperService.name);

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    ) {}

    async onModuleDestroy() {
        try {
            await this.redisClient.quit();
            this.logger.log('Redis client disconnected');
        } catch (error) {
            this.logger.error('Error disconnecting Redis client:', error);
        }
    }

    /**
     * Set data with TTL (Time To Live)
     */
    async setWithTTL(
        key: string,
        value: string,
        ttlSeconds: number,
    ): Promise<void> {
        try {
            await this.redisClient.setEx(key, ttlSeconds, value);
        } catch (error) {
            this.logger.error(`Error setting key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Get data from Redis
     */
    async get(key: string): Promise<string | null> {
        try {
            return await this.redisClient.get(key);
        } catch (error) {
            this.logger.error(`Error getting key ${key}:`, error);
            return null;
        }
    }

    /**
     * Add member to set
     */
    async addToSet(key: string, member: string): Promise<boolean> {
        try {
            const result = await this.redisClient.sAdd(key, member);
            return result > 0;
        } catch (error) {
            this.logger.error(`Error adding to set ${key}:`, error);
            return false;
        }
    }

    /**
     * Remove member from set
     */
    async removeFromSet(key: string, member: string): Promise<boolean> {
        try {
            const result = await this.redisClient.sRem(key, member);
            return result > 0;
        } catch (error) {
            this.logger.error(`Error removing from set ${key}:`, error);
            return false;
        }
    }

    /**
     * Get all members from set
     */
    async getSetMembers(key: string): Promise<string[]> {
        try {
            return await this.redisClient.sMembers(key);
        } catch (error) {
            this.logger.error(`Error getting set members ${key}:`, error);
            return [];
        }
    }

    /**
     * Delete key(s)
     */
    async delete(key: string | string[]): Promise<number> {
        try {
            return await this.redisClient.del(key);
        } catch (error) {
            this.logger.error(`Error deleting key(s):`, error);
            return 0;
        }
    }

    /**
     * Set TTL for existing key
     */
    async setTTL(key: string, ttlSeconds: number): Promise<boolean> {
        try {
            const result = await this.redisClient.expire(key, ttlSeconds);
            return result;
        } catch (error) {
            this.logger.error(`Error setting TTL for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redisClient.exists(key);
            return result > 0;
        } catch (error) {
            this.logger.error(`Error checking existence of key ${key}:`, error);
            return false;
        }
    }

    /**
     * Increment counter
     */
    async increment(key: string): Promise<number> {
        try {
            return await this.redisClient.incr(key);
        } catch (error) {
            this.logger.error(`Error incrementing key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Execute multiple commands atomically
     */
    async executeMulti(commands: Array<() => any>): Promise<any[]> {
        try {
            const multi = this.redisClient.multi();

            commands.forEach((command) => command());

            return await multi.exec();
        } catch (error) {
            this.logger.error('Error executing multi commands:', error);
            throw error;
        }
    }

    /**
     * Get keys by pattern
     */
    async getKeysByPattern(pattern: string): Promise<string[]> {
        try {
            return await this.redisClient.keys(pattern);
        } catch (error) {
            this.logger.error(
                `Error getting keys by pattern ${pattern}:`,
                error,
            );
            return [];
        }
    }

    /**
     * Health check for Redis connection
     */
    async ping(): Promise<boolean> {
        try {
            const result = await this.redisClient.ping();
            return result === 'PONG';
        } catch (error) {
            this.logger.error('Redis ping failed:', error);
            return false;
        }
    }

    /**
     * Get Redis client for direct operations
     */
    getClient(): RedisClientType {
        return this.redisClient;
    }
}
