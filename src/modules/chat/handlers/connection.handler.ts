import {
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { RedisClientType } from 'redis';
import { Server } from 'socket.io';
import { RolesNameEnum } from 'src/enums';
import { AuthService } from 'src/modules/auth/auth.service';
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
import { getWsErrorMessage } from '../utils';
import { TypingHandler } from './typing.handler';

@Injectable()
export class ConnectionHandler {
    private readonly logger = new Logger(ConnectionHandler.name);

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
        private readonly typingHandler: TypingHandler,
        private readonly authService: AuthService,
    ) {}

    async handleConnection(client: AuthenticatedSocket, server: Server) {
        try {
            const authHeader =
                client.handshake.headers.authorization ||
                (client.handshake.auth?.token as string);

            const token = authHeader?.split(' ')[1];

            if (!token) {
                throw new UnauthorizedException(
                    ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
                );
            }

            const userPayload = await this.authService.verifyToken(token);
            if (!userPayload) {
                throw new UnauthorizedException('Invalid or expired token.');
            }

            client.user = userPayload;

            const user = client.user;
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
                `Client connected: ${client.id}, User: ${user.fullName} (${user.role})`,
            );

            client.emit(CHAT_EVENTS.CONNECTED, {
                status: RESPONSE_STATUS.SUCCESS,
                message: SUCCESS_MESSAGES.CONNECTION_SUCCESS,
                user: { id: user.id, fullName: user.fullName, role: user.role },
                timestamp: new Date().toISOString(),
            });

            if (user.role === RolesNameEnum.CONSULTANT) {
                server.emit(CHAT_EVENTS.CONSULTANT_ONLINE, {
                    consultantId: user.id,
                    consultantName: user.fullName,
                    timestamp: new Date().toISOString(),
                });
            }
        } catch (error) {
            this.logger.error(
                `Connection failed for socket ${client.id}: ${error.message}`,
            );
            client.emit('error', { message: getWsErrorMessage(error) });
            client.disconnect(true);
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

    async cleanupOfflineUsers() {
        try {
            this.logger.log('Starting offline users cleanup...');

            const pattern = `${REDIS_KEYS.USER_PRESENCE}*`;
            const presenceKeys = await this.redisClient.keys(pattern);

            let cleanupCount = 0;
            const now = Date.now();
            const offlineThreshold = 30 * 60 * 1000; // 30 minutes in milliseconds

            for (const presenceKey of presenceKeys) {
                try {
                    const presenceData =
                        await this.redisClient.get(presenceKey);
                    if (!presenceData) continue;

                    const presence: UserPresence = JSON.parse(presenceData);
                    const lastSeenAge = now - presence.lastSeen;

                    // If user has been offline for more than threshold, cleanup their data
                    if (lastSeenAge > offlineThreshold) {
                        const userId = presence.userId;

                        // Get user's rooms for cleanup
                        const userRoomsKey = `${REDIS_KEYS.USER_ROOMS}${userId}`;
                        const userRooms =
                            await this.redisClient.sMembers(userRoomsKey);

                        const multi = this.redisClient.multi();

                        // Remove user from all question rooms
                        for (const questionId of userRooms) {
                            multi.sRem(
                                `${REDIS_KEYS.QUESTION_USERS}${questionId}`,
                                userId,
                            );
                            // Remove from typing status
                            multi.del(
                                `${REDIS_KEYS.TYPING_USERS}${questionId}:${userId}`,
                            );
                        }

                        // Remove user presence and rooms data
                        multi.del(presenceKey);
                        multi.del(userRoomsKey);

                        await multi.exec();
                        cleanupCount++;

                        this.logger.debug(
                            `Cleaned up offline user: ${presence.fullName} (${userId}), last seen: ${new Date(presence.lastSeen).toISOString()}`,
                        );
                    }
                } catch (error) {
                    this.logger.error(
                        `Error cleaning up user from key ${presenceKey}:`,
                        error,
                    );
                }
            }

            this.logger.log(
                `Offline users cleanup completed. Cleaned up ${cleanupCount} users`,
            );
            return cleanupCount;
        } catch (error) {
            this.logger.error('Error during offline users cleanup:', error);
            throw error;
        }
    }

    async cleanupCompletedChatRooms() {
        try {
            this.logger.log('Starting completed chat rooms cleanup...');

            let cleanupCount = 0;

            // Get all question room keys
            const questionUsersPattern = `${REDIS_KEYS.QUESTION_USERS}*`;
            const questionKeys =
                await this.redisClient.keys(questionUsersPattern);

            for (const questionKey of questionKeys) {
                try {
                    // Extract question ID from key
                    const questionId = questionKey.replace(
                        REDIS_KEYS.QUESTION_USERS,
                        '',
                    );

                    // Here we would need to query the database to check if the appointment is completed
                    // For now, we'll use a simple approach: if no users have been active in the room for 30 days
                    const roomUsers =
                        await this.redisClient.sMembers(questionKey);

                    // If room is empty or has been inactive, check if we should clean it up
                    if (roomUsers.length === 0) {
                        // Check if this room has been inactive for a long time
                        // We can use the TTL or check room activity
                        const ttl = await this.redisClient.ttl(questionKey);

                        // If TTL is close to expiring or room is empty, clean up related data
                        if (ttl < 300) {
                            // Less than 5 minutes left
                            const multi = this.redisClient.multi();

                            // Clean up all related Redis data for this question
                            multi.del(questionKey);
                            multi.del(
                                `${REDIS_KEYS.TYPING_USERS}${questionId}*`,
                            );

                            await multi.exec();
                            cleanupCount++;

                            this.logger.debug(
                                `Cleaned up inactive chat room: ${questionId}`,
                            );
                        }
                    }
                } catch (error) {
                    this.logger.error(
                        `Error cleaning up chat room ${questionKey}:`,
                        error,
                    );
                }
            }

            this.logger.log(
                `Completed chat rooms cleanup finished. Cleaned up ${cleanupCount} rooms`,
            );
            return cleanupCount;
        } catch (error) {
            this.logger.error(
                'Error during completed chat rooms cleanup:',
                error,
            );
            throw error;
        }
    }
}
