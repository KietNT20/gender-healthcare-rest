import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

interface RateLimitData {
    count: number;
    resetTime: number;
    lastRequest: number;
}

@Injectable()
export class WsThrottleGuard implements CanActivate {
    private readonly logger = new Logger(WsThrottleGuard.name);
    private readonly rateLimitMap = new Map<string, RateLimitData>();

    // Configuration
    private readonly maxRequests = 30; // requests per window
    private readonly windowMs = 60000; // 1 minute
    private readonly cooldownMs = 5000; // 5 seconds between requests for high-frequency users

    canActivate(context: ExecutionContext): boolean {
        const client = context.switchToWs().getClient();
        const eventName = context.switchToWs().getPattern();

        if (!client.user) {
            return true; // Let authentication guard handle this
        }

        const userId = client.user.id;
        const now = Date.now();

        // Get or create rate limit data for user
        let userRateLimit = this.rateLimitMap.get(userId);

        if (!userRateLimit || now > userRateLimit.resetTime) {
            // Reset or create new rate limit window
            userRateLimit = {
                count: 0,
                resetTime: now + this.windowMs,
                lastRequest: 0,
            };
            this.rateLimitMap.set(userId, userRateLimit);
        }

        // Check if user is making requests too frequently
        if (
            now - userRateLimit.lastRequest < this.cooldownMs &&
            userRateLimit.count > 10
        ) {
            this.logger.warn(`User ${userId} making requests too frequently`);
            throw new WsException({
                success: false,
                message: 'Too many requests. Please slow down.',
                code: 'RATE_LIMIT_COOLDOWN',
                retryAfter: this.cooldownMs,
            });
        }

        // Check rate limit
        if (userRateLimit.count >= this.maxRequests) {
            this.logger.warn(
                `Rate limit exceeded for user ${userId} on event ${eventName}`,
            );
            throw new WsException({
                success: false,
                message: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: userRateLimit.resetTime - now,
            });
        }

        // Update counters
        userRateLimit.count++;
        userRateLimit.lastRequest = now;

        return true;
    }

    // Cleanup old entries (call this periodically)
    cleanup(): void {
        const now = Date.now();
        for (const [userId, data] of this.rateLimitMap.entries()) {
            if (now > data.resetTime + this.windowMs) {
                this.rateLimitMap.delete(userId);
            }
        }
    }
}
