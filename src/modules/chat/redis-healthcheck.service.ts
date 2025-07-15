import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisHealthService {
    private readonly logger = new Logger(RedisHealthService.name);
    private isRedisHealthy = false;
    private lastHealthCheck = new Date();

    constructor(@Inject('REDIS_CLIENT') private redisClient: RedisClientType) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async checkRedisHealth() {
        try {
            const start = Date.now();
            const result = await this.redisClient.ping();
            const latency = Date.now() - start;

            if (result === 'PONG') {
                this.isRedisHealthy = true;
                this.lastHealthCheck = new Date();

                if (latency > 1000) {
                    this.logger.warn(`Redis ping slow: ${latency}ms`);
                } else {
                    this.logger.debug(`Redis ping: ${latency}ms`);
                }
            } else {
                this.isRedisHealthy = false;
                this.logger.error('Redis ping failed: unexpected response');
            }
        } catch (error) {
            this.isRedisHealthy = false;
            this.logger.error('Redis health check failed:', error);
        }
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async getRedisInfo() {
        try {
            const info = await this.redisClient.info('memory');
            const lines = info.split('\r\n');
            const memoryInfo = lines
                .filter((line) => line.includes('used_memory_human'))
                .map((line) => line.split(':'))
                .reduce(
                    (acc, [key, value]) => {
                        acc[key] = value;
                        return acc;
                    },
                    {} as Record<string, string>,
                );

            this.logger.log(
                `Redis Memory Usage: ${memoryInfo.used_memory_human}`,
            );
        } catch (error) {
            this.logger.error('Failed to get Redis info:', error);
        }
    }

    async getHealthStatus() {
        return {
            isHealthy: this.isRedisHealthy,
            lastCheck: this.lastHealthCheck,
            uptime: await this.getRedisUptime(),
        };
    }

    private async getRedisUptime(): Promise<string | null> {
        try {
            const info = await this.redisClient.info('server');
            const uptimeLine = info
                .split('\r\n')
                .find((line) => line.startsWith('uptime_in_seconds:'));
            if (uptimeLine) {
                const seconds = parseInt(uptimeLine.split(':')[1]);
                return this.formatUptime(seconds);
            }
            return null;
        } catch (error) {
            this.logger.error('Failed to get Redis uptime:', error);
            return null;
        }
    }

    private formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }
}
