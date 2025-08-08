import { Injectable, Logger } from '@nestjs/common';
import { CHAT_EVENTS, ROOM_PATTERNS } from '../../constants/events';
import {
    AuthenticatedSocket,
    JoinRoomData,
} from '../../core/interfaces/socket.interface';
import { ChatCoreService } from '../../core/services/chat-core.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class RoomHandler {
    private readonly logger = new Logger(RoomHandler.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly chatCoreService: ChatCoreService,
    ) {}

    async handleJoinQuestion(
        data: JoinRoomData,
        client: AuthenticatedSocket,
    ): Promise<void> {
        try {
            const { questionId } = data;
            const userId = client.data.userId;
            const username = client.data.user?.firstName || 'Unknown User';

            // Validate user access
            const hasAccess = await this.chatCoreService.validateUserAccess(
                questionId,
                userId as string,
            );
            if (!hasAccess) {
                throw new Error('Access denied to this question');
            }

            // Check if user is already in the room
            const isAlreadyInRoom = await this.redisService.isUserInRoom(
                questionId,
                userId as string,
            );
            if (isAlreadyInRoom) {
                this.logger.log(
                    `User ${username} is already in room ${questionId}`,
                );
                return;
            }

            // Add user to room
            await this.redisService.addUserToRoom(questionId, userId as string);
            await this.redisService.addUserRoom(userId as string, questionId);

            // Join socket room
            const roomName = `${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`;
            await client.join(roomName);

            // Notify other users in the room
            client.to(roomName).emit(CHAT_EVENTS.USER_JOINED, {
                userId,
                username,
                questionId,
                timestamp: new Date().toISOString(),
            });

            this.logger.log(`User ${username} joined question ${questionId}`);
        } catch (error) {
            this.logger.error(
                `Error joining question ${data.questionId}:`,
                error,
            );
            throw error;
        }
    }

    async handleLeaveQuestion(
        data: JoinRoomData,
        client: AuthenticatedSocket,
    ): Promise<void> {
        try {
            const { questionId } = data;
            const userId = client.data.userId;
            const username = client.data.user?.firstName || 'Unknown User';

            // Remove user from room
            await this.redisService.removeUserFromRoom(
                questionId,
                userId as string,
            );
            await this.redisService.removeUserRoom(
                userId as string,
                questionId,
            );

            // Leave socket room
            const roomName = `${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`;
            await client.leave(roomName);

            // Notify other users in the room
            client.to(roomName).emit(CHAT_EVENTS.USER_LEFT, {
                userId,
                username,
                questionId,
                timestamp: new Date().toISOString(),
            });

            this.logger.log(`User ${username} left question ${questionId}`);
        } catch (error) {
            this.logger.error(
                `Error leaving question ${data.questionId}:`,
                error,
            );
            throw error;
        }
    }

    async getRoomUsers(questionId: string): Promise<string[]> {
        return await this.redisService.getRoomUsers(questionId);
    }

    async isUserInRoom(questionId: string, userId: string): Promise<boolean> {
        return await this.redisService.isUserInRoom(questionId, userId);
    }

    async getOnlineUsersInQuestion(questionId: string): Promise<string[]> {
        const roomUsers = await this.redisService.getRoomUsers(questionId);
        const onlineUsers: string[] = [];

        for (const userId of roomUsers) {
            const presence = await this.redisService.getUserPresence(userId);
            if (presence?.isOnline) {
                onlineUsers.push(userId);
            }
        }

        return onlineUsers;
    }
}
