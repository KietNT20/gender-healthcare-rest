import {
    ForbiddenException,
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { RedisClientType } from 'redis';
import { Server } from 'socket.io';
import { ChatService } from '../chat.service';
import {
    CHAT_EVENTS,
    ERROR_MESSAGES,
    REDIS_KEYS,
    RESPONSE_STATUS,
    ROOM_PATTERNS,
    SUCCESS_MESSAGES,
    TTL_VALUES,
} from '../constants/chat.constants';
import {
    AuthenticatedSocket,
    JoinRoomData,
} from '../interfaces/chat.interface';
import { TypingHandler } from './typing.handler';

@Injectable()
export class RoomHandler {
    private readonly logger = new Logger(RoomHandler.name);

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
        private readonly chatService: ChatService,
        private readonly typingHandler: TypingHandler,
    ) {}

    async handleJoinQuestion(
        data: JoinRoomData,
        client: AuthenticatedSocket,
        server: Server,
    ) {
        if (!client.user) {
            throw new UnauthorizedException(
                ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
            );
        }

        const { questionId } = data;

        try {
            // Verify user has access to this question
            const hasAccess = await this.chatService.verifyQuestionAccess(
                questionId,
                client.user.id,
            );

            if (!hasAccess) {
                throw new ForbiddenException(ERROR_MESSAGES.ACCESS_DENIED);
            }

            // Leave previous room if any
            if (client.questionId && client.questionId !== questionId) {
                await this.leaveQuestionRoom(client, client.questionId);
            }

            // Join new room
            client.join(`${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`);
            client.questionId = questionId;

            // Update Redis: Add user to question and track user's rooms
            const multi = this.redisClient.multi();
            multi.sAdd(
                `${REDIS_KEYS.QUESTION_USERS}${questionId}`,
                client.user.id,
            );
            multi.sAdd(`${REDIS_KEYS.USER_ROOMS}${client.user.id}`, questionId);
            multi.expire(
                `${REDIS_KEYS.QUESTION_USERS}${questionId}`,
                TTL_VALUES.QUESTION_USERS,
            );
            multi.expire(
                `${REDIS_KEYS.USER_ROOMS}${client.user.id}`,
                TTL_VALUES.USER_ROOMS,
            );
            await multi.exec();

            // Get message history
            const messages =
                await this.chatService.getMessageHistory(questionId);

            // Send room joined confirmation with message history
            client.emit(CHAT_EVENTS.JOINED_QUESTION, {
                status: RESPONSE_STATUS.SUCCESS,
                message: SUCCESS_MESSAGES.JOIN_SUCCESS,
                questionId,
                messages,
                timestamp: new Date().toISOString(),
            });

            // Notify others in room about new participant
            client
                .to(`${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`)
                .emit(CHAT_EVENTS.USER_JOINED, {
                    userId: client.user.id,
                    userName: client.user.fullName,
                    userRole: client.user.role,
                    questionId,
                    timestamp: new Date().toISOString(),
                });

            this.logger.log(
                `User ${client.user.id} joined question room: ${questionId}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to join question ${questionId}:`,
                error.message,
            );
            throw error;
        }
    }

    async handleLeaveQuestion(
        data: JoinRoomData,
        client: AuthenticatedSocket,
        server: Server,
    ) {
        if (!client.user) return;

        const { questionId } = data;
        await this.leaveQuestionRoom(client, questionId);
    }

    async leaveQuestionRoom(client: AuthenticatedSocket, questionId: string) {
        if (!client.user) return;

        try {
            client.leave(`${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`);

            // Remove from Redis tracking
            const multi = this.redisClient.multi();
            multi.sRem(
                `${REDIS_KEYS.QUESTION_USERS}${questionId}`,
                client.user.id,
            );
            multi.sRem(`${REDIS_KEYS.USER_ROOMS}${client.user.id}`, questionId);

            // Remove from typing users
            await this.typingHandler.removeUserFromTyping(
                questionId,
                client.user.id,
            );

            await multi.exec();

            // Notify others in room
            client
                .to(`${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`)
                .emit(CHAT_EVENTS.USER_LEFT, {
                    userId: client.user.id,
                    userName: client.user.fullName,
                    questionId,
                    timestamp: new Date().toISOString(),
                });

            // Clear questionId from client
            if (client.questionId === questionId) {
                client.questionId = undefined;
            }

            this.logger.log(
                `User ${client.user.id} left question room: ${questionId}`,
            );
        } catch (error) {
            this.logger.error('Error leaving question room:', error);
        }
    }

    async getOnlineUsersInQuestion(questionId: string): Promise<string[]> {
        try {
            return await this.redisClient.sMembers(
                `${REDIS_KEYS.QUESTION_USERS}${questionId}`,
            );
        } catch (error) {
            this.logger.error('Error getting online users:', error);
            return [];
        }
    }

    async removeUserFromAllRooms(userId: string, server: Server) {
        try {
            const userRoomsKey = `${REDIS_KEYS.USER_ROOMS}${userId}`;
            const userRooms = await this.redisClient.sMembers(userRoomsKey);

            const multi = this.redisClient.multi();

            for (const questionId of userRooms) {
                // Remove from question users
                multi.sRem(`${REDIS_KEYS.QUESTION_USERS}${questionId}`, userId);

                // Remove from typing users
                await this.typingHandler.removeUserFromTyping(
                    questionId,
                    userId,
                );
            }

            // Remove user rooms
            multi.del(userRoomsKey);

            await multi.exec();
        } catch (error) {
            this.logger.error('Error removing user from all rooms:', error);
        }
    }
}
