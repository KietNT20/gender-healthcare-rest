import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisWsThrottleGuard implements CanActivate {
    private readonly logger = new Logger(RedisWsThrottleGuard.name);

    // Configuration
    private readonly maxRequests = 30; // requests per window
    private readonly windowMs = 60000; // 1 minute
    private readonly cooldownMs = 5000; // 5 seconds between requests for high-frequency users
    private readonly keyPrefix = 'ws:throttle:';

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client = context.switchToWs().getClient();
        const eventName = context.switchToWs().getPattern();

        if (!client.user) {
            return true; // Let authentication guard handle this
        }

        const userId = client.user.id;
        const now = Date.now();
        const windowKey = `${this.keyPrefix}${userId}:${Math.floor(now / this.windowMs)}`;
        const cooldownKey = `${this.keyPrefix}${userId}:cooldown`;

        try {
            // Check cooldown
            const lastRequest = await this.redisClient.get(cooldownKey);
            if (lastRequest && now - parseInt(lastRequest) < this.cooldownMs) {
                const count = await this.redisClient.get(windowKey);
                if (count && parseInt(count) > 10) {
                    this.logger.warn(
                        `User ${userId} making requests too frequently`,
                    );
                    throw new WsException({
                        success: false,
                        message: 'Too many requests. Please slow down.',
                        code: 'RATE_LIMIT_COOLDOWN',
                        retryAfter: this.cooldownMs,
                    });
                }
            }

            // Check rate limit using Redis
            const multi = this.redisClient.multi();
            multi.incr(windowKey);
            multi.expire(windowKey, Math.ceil(this.windowMs / 1000));
            multi.setEx(
                cooldownKey,
                Math.ceil(this.cooldownMs / 1000),
                now.toString(),
            );

            const results = await multi.exec();
            const requestCount = results[0] as number;

            if (requestCount > this.maxRequests) {
                this.logger.warn(
                    `Rate limit exceeded for user ${userId} on event ${eventName}. Count: ${requestCount}`,
                );
                throw new WsException({
                    success: false,
                    message: 'Rate limit exceeded',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil(this.windowMs / 1000),
                });
            }

            return true;
        } catch (error) {
            if (error instanceof WsException) {
                throw error;
            }

            this.logger.error('Error in throttle guard:', error);
            return true; // Allow request on Redis error
        }
    }
}
