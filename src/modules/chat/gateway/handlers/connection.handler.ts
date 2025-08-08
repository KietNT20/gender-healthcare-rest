import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { CHAT_EVENTS } from '../../constants/events';
import { SUCCESS_MESSAGES } from '../../constants/messages';
import { AuthenticatedSocket } from '../../core/interfaces/socket.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class ConnectionHandler {
    private readonly logger = new Logger(ConnectionHandler.name);

    constructor(private readonly redisService: RedisService) {}

    async handleConnection(
        client: AuthenticatedSocket,
        server: Server,
    ): Promise<void> {
        try {
            const userId = client.data.userId;
            const username = client.data.user?.firstName || 'Unknown User';

            // Set user as online
            await this.redisService.setUserPresence(userId as string, true);

            // Send connection confirmation
            client.emit(CHAT_EVENTS.CONNECTED, {
                status: 'success',
                message: SUCCESS_MESSAGES.CONNECTION_SUCCESS,
                userId,
                username,
                timestamp: new Date().toISOString(),
            });

            this.logger.log(`User ${username} (${userId}) connected`);

            // Notify other users about new online user
            server.emit(CHAT_EVENTS.USER_JOINED, {
                userId,
                username,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error('Error handling connection:', error);
            throw error;
        }
    }

    async handleDisconnect(
        client: AuthenticatedSocket,
        server: Server,
    ): Promise<void> {
        try {
            const userId = client.data.userId;
            const username = client.data.user?.firstName || 'Unknown User';

            // Get user's current rooms before disconnecting
            const userRooms = await this.redisService.getUserRooms(
                userId as string,
            );

            // Remove user from all rooms
            for (const questionId of userRooms) {
                await this.redisService.removeUserFromRoom(
                    questionId,
                    userId as string,
                );
                await this.redisService.removeUserRoom(
                    userId as string,
                    questionId,
                );

                // Notify other users in the room
                const roomName = `question_${questionId}`;
                server.to(roomName).emit(CHAT_EVENTS.USER_LEFT, {
                    userId,
                    username,
                    questionId,
                    timestamp: new Date().toISOString(),
                });
            }

            // Set user as offline
            await this.redisService.setUserPresence(userId as string, false);

            this.logger.log(`User ${username} (${userId}) disconnected`);

            // Notify other users about offline user
            server.emit(CHAT_EVENTS.USER_LEFT, {
                userId,
                username,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error('Error handling disconnect:', error);
        }
    }

    async handleReconnection(
        client: AuthenticatedSocket,
        server: Server,
    ): Promise<void> {
        try {
            const userId = client.data.userId;
            const username = client.data.user?.firstName || 'Unknown User';

            // Set user as online again
            await this.redisService.setUserPresence(userId as string, true);

            // Rejoin previous rooms
            const userRooms = await this.redisService.getUserRooms(
                userId as string,
            );
            for (const questionId of userRooms) {
                await this.redisService.addUserToRoom(
                    questionId,
                    userId as string,
                );

                const roomName = `question_${questionId}`;
                await client.join(roomName);

                // Notify other users in the room
                server.to(roomName).emit(CHAT_EVENTS.USER_JOINED, {
                    userId,
                    username,
                    questionId,
                    timestamp: new Date().toISOString(),
                });
            }

            this.logger.log(`User ${username} (${userId}) reconnected`);
        } catch (error) {
            this.logger.error('Error handling reconnection:', error);
            throw error;
        }
    }
}
