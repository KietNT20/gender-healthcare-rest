import {
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { RedisClientType } from 'redis';
import { Server } from 'socket.io';
import {
    CHAT_EVENTS,
    ERROR_MESSAGES,
    REDIS_KEYS,
    RESPONSE_STATUS,
    SUCCESS_MESSAGES,
    TTL_VALUES,
} from '../constants/chat.constants';
import {
    AuthenticatedSocket,
    UserPresence,
} from '../interfaces/chat.interface';
import { TypingHandler } from './typing.handler';

@Injectable()
export class ConnectionHandler {
    private readonly logger = new Logger(ConnectionHandler.name);

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
        private readonly typingHandler: TypingHandler,
    ) {}

    async handleConnection(client: AuthenticatedSocket, server: Server) {
        const user = client.user;

        if (!user) {
            throw new UnauthorizedException(
                ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
            );
        }

        try {
            // Store user presence in Redis with TTL
            const presence: UserPresence = {
                userId: user.id,
                socketId: client.id,
                fullName: user.fullName,
                role: user.role,
                lastSeen: Date.now(),
            };

            await this.redisClient.setEx(
                `${REDIS_KEYS.USER_PRESENCE}${user.id}`,
                TTL_VALUES.USER_PRESENCE,
                JSON.stringify(presence),
            );

            this.logger.log(
                `Client connected: ${client.id}, User: ${user.fullName}`,
            );

            client.emit(CHAT_EVENTS.CONNECTED, {
                status: RESPONSE_STATUS.SUCCESS,
                message: SUCCESS_MESSAGES.CONNECTION_SUCCESS,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    role: user.role,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error('Error handling connection:', error);
            throw new InternalServerErrorException(
                ERROR_MESSAGES.CONNECTION_FAILED,
            );
        }
    }

    async handleDisconnect(client: AuthenticatedSocket, server: Server) {
        const user = client.user;

        if (user) {
            try {
                // Get user's rooms before cleanup
                const userRoomsKey = `${REDIS_KEYS.USER_ROOMS}${user.id}`;
                const userRooms = await this.redisClient.sMembers(userRoomsKey);

                // Clean up user from all rooms and typing status
                const multi = this.redisClient.multi();

                for (const questionId of userRooms) {
                    // Remove from question users
                    multi.sRem(
                        `${REDIS_KEYS.QUESTION_USERS}${questionId}`,
                        user.id,
                    );

                    // Remove from typing users
                    await this.typingHandler.removeUserFromTyping(
                        questionId,
                        user.id,
                    );

                    // Notify room about user leaving
                    server
                        .to(`question_${questionId}`)
                        .emit(CHAT_EVENTS.USER_LEFT, {
                            userId: user.id,
                            userName: user.fullName,
                            questionId,
                            timestamp: new Date().toISOString(),
                        });
                }

                // Remove user presence and rooms
                multi.del(`${REDIS_KEYS.USER_PRESENCE}${user.id}`);
                multi.del(userRoomsKey);

                await multi.exec();

                this.logger.log(
                    `Client disconnected: ${client.id}, User: ${user.fullName}`,
                );
            } catch (error) {
                this.logger.error('Error handling disconnect:', error);
            }
        } else {
            this.logger.log(
                `Client disconnected: ${client.id} (unauthenticated)`,
            );
        }
    }

    async isUserOnline(userId: string): Promise<boolean> {
        try {
            const presence = await this.redisClient.get(
                `${REDIS_KEYS.USER_PRESENCE}${userId}`,
            );
            return !!presence;
        } catch (error) {
            this.logger.error('Error checking user online status:', error);
            return false;
        }
    }

    async getUserPresence(userId: string): Promise<UserPresence | null> {
        try {
            const presenceData = await this.redisClient.get(
                `${REDIS_KEYS.USER_PRESENCE}${userId}`,
            );
            return presenceData ? JSON.parse(presenceData) : null;
        } catch (error) {
            this.logger.error('Error getting user presence:', error);
            return null;
        }
    }
}
