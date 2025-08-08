import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ERROR_MESSAGES } from '../../constants/messages';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AuthenticatedSocket } from '../interfaces/socket.interface';

@Injectable()
export class WsThrottleGuard implements CanActivate {
    private readonly throttleMap = new Map<string, number>();
    private readonly throttleLimit = 10; // messages per minute
    private readonly throttleWindow = 60000; // 1 minute in milliseconds

    constructor(private readonly redisService: RedisService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: AuthenticatedSocket = context
                .switchToWs()
                .getClient();
            const eventName =
                context.switchToWs().getData()?.event || 'unknown';

            if (!client.data.userId) {
                throw new WsException(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
            }

            const throttleKey = `${client.data.userId}:${eventName}`;
            const now = Date.now();

            // Check Redis for existing throttle data
            const redisKey = `throttle:${throttleKey}`;
            const redisData = await this.redisService.getClient().get(redisKey);

            if (redisData) {
                const { count, resetTime } = JSON.parse(redisData);

                if (now < resetTime) {
                    if (count >= this.throttleLimit) {
                        throw new WsException(
                            'Rate limit exceeded. Please wait before sending more messages.',
                        );
                    }

                    // Increment count
                    await this.redisService
                        .getClient()
                        .setEx(
                            redisKey,
                            60,
                            JSON.stringify({ count: count + 1, resetTime }),
                        );
                } else {
                    // Reset throttle
                    await this.redisService.getClient().setEx(
                        redisKey,
                        60,
                        JSON.stringify({
                            count: 1,
                            resetTime: now + this.throttleWindow,
                        }),
                    );
                }
            } else {
                // First request
                await this.redisService.getClient().setEx(
                    redisKey,
                    60,
                    JSON.stringify({
                        count: 1,
                        resetTime: now + this.throttleWindow,
                    }),
                );
            }

            return true;
        } catch (error) {
            throw new WsException(
                error instanceof WsException
                    ? error.getError()
                    : ERROR_MESSAGES.INTERNAL_ERROR,
            );
        }
    }
}
