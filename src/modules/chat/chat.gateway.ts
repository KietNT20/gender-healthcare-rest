import { Inject, Logger, UseGuards } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
} from '@nestjs/websockets';
import { RedisClientType } from 'redis';
import { Server, Socket } from 'socket.io';
import { MessageType } from 'src/enums';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsRoomAccessGuard } from './guards/ws-room-access.guard';
import { RedisWsThrottleGuard } from './guards/ws-throttle.guard';

interface AuthenticatedSocket extends Socket {
    user?: {
        id: string;
        email: string;
        role: string;
        fullName: string;
    };
    questionId?: string;
}

interface TypingData {
    questionId: string;
    isTyping: boolean;
}

interface JoinRoomData {
    questionId: string;
}

interface UserPresence {
    userId: string;
    socketId: string;
    fullName: string;
    role: string;
    lastSeen: number;
}

@UseGuards(WsJwtGuard)
@WebSocketGateway({
    namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    // Redis key patterns
    private readonly REDIS_KEYS = {
        USER_PRESENCE: 'chat:user:presence:',
        QUESTION_USERS: 'chat:question:users:',
        TYPING_USERS: 'chat:question:typing:',
        USER_ROOMS: 'chat:user:rooms:',
    };

    constructor(
        private readonly chatService: ChatService,
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    ) {}

    async handleConnection(client: AuthenticatedSocket) {
        const user = client.user;

        if (!user) {
            throw new WsException('User not authenticated');
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
                `${this.REDIS_KEYS.USER_PRESENCE}${user.id}`,
                300, // 5 minutes TTL
                JSON.stringify(presence),
            );

            this.logger.log(
                `Client connected: ${client.id}, User: ${user.fullName}`,
            );

            client.emit('connected', {
                success: true,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    role: user.role,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error('Error handling connection:', error);
            throw new WsException('Connection failed');
        }
    }

    async handleDisconnect(client: AuthenticatedSocket) {
        const user = client.user;

        if (user) {
            try {
                // Get user's rooms before cleanup
                const userRoomsKey = `${this.REDIS_KEYS.USER_ROOMS}${user.id}`;
                const userRooms = await this.redisClient.sMembers(userRoomsKey);

                // Clean up user from all rooms and typing status
                const multi = this.redisClient.multi();

                for (const questionId of userRooms) {
                    // Remove from question users
                    multi.sRem(
                        `${this.REDIS_KEYS.QUESTION_USERS}${questionId}`,
                        user.id,
                    );

                    // Remove from typing users
                    multi.sRem(
                        `${this.REDIS_KEYS.TYPING_USERS}${questionId}`,
                        user.id,
                    );

                    // Notify room about user leaving
                    this.server.to(`question_${questionId}`).emit('user_left', {
                        userId: user.id,
                        userName: user.fullName,
                        questionId,
                        timestamp: new Date().toISOString(),
                    });
                }

                // Remove user presence and rooms
                multi.del(`${this.REDIS_KEYS.USER_PRESENCE}${user.id}`);
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

    @UseGuards(WsRoomAccessGuard, RedisWsThrottleGuard)
    @SubscribeMessage('join_question')
    async handleJoinQuestion(
        @MessageBody() data: JoinRoomData,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        if (!client.user) {
            throw new WsException('User not authenticated');
        }

        const { questionId } = data;

        try {
            // Verify user has access to this question
            const hasAccess = await this.chatService.verifyQuestionAccess(
                questionId,
                client.user.id,
            );

            if (!hasAccess) {
                throw new WsException('Access denied to this question');
            }

            // Leave previous room if any
            if (client.questionId && client.questionId !== questionId) {
                await this.leaveQuestionRoom(client, client.questionId);
            }

            // Join new room
            client.join(`question_${questionId}`);
            client.questionId = questionId;

            // Update Redis: Add user to question and track user's rooms
            const multi = this.redisClient.multi();
            multi.sAdd(
                `${this.REDIS_KEYS.QUESTION_USERS}${questionId}`,
                client.user.id,
            );
            multi.sAdd(
                `${this.REDIS_KEYS.USER_ROOMS}${client.user.id}`,
                questionId,
            );
            multi.expire(
                `${this.REDIS_KEYS.QUESTION_USERS}${questionId}`,
                3600,
            ); // 1 hour TTL
            multi.expire(
                `${this.REDIS_KEYS.USER_ROOMS}${client.user.id}`,
                3600,
            );
            await multi.exec();

            // Get message history
            const messages =
                await this.chatService.getMessageHistory(questionId);

            // Send room joined confirmation with message history
            client.emit('joined_question', {
                questionId,
                messages,
                timestamp: new Date().toISOString(),
            });

            // Notify others in room about new participant
            client.to(`question_${questionId}`).emit('user_joined', {
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
            client.emit('join_error', {
                message: error.message,
                questionId,
                timestamp: new Date().toISOString(),
            });
        }
    }

    @SubscribeMessage('leave_question')
    async handleLeaveQuestion(
        @MessageBody() data: JoinRoomData,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        if (!client.user) return;

        const { questionId } = data;
        await this.leaveQuestionRoom(client, questionId);
    }

    @UseGuards(WsRoomAccessGuard, RedisWsThrottleGuard)
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @MessageBody() data: CreateChatDto & { questionId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        if (!client.user) {
            throw new WsException('User not authenticated');
        }

        try {
            const { questionId, content, type = MessageType.TEXT } = data;

            // Verify user has access to this question
            const hasAccess = await this.chatService.verifyQuestionAccess(
                questionId,
                client.user.id,
            );

            if (!hasAccess) {
                throw new WsException('Access denied to this question');
            }

            // Save message to database
            const message = await this.chatService.createMessage({
                content,
                type,
                questionId,
                senderId: client.user.id,
            });

            // Broadcast message to room
            this.server.to(`question_${questionId}`).emit('new_message', {
                ...message,
                sender: {
                    id: client.user.id,
                    fullName: client.user.fullName,
                    role: client.user.role,
                },
                timestamp: new Date().toISOString(),
            });

            // Mark question as having new activity
            await this.chatService.updateQuestionActivity(questionId);

            this.logger.log(
                `Message sent in question ${questionId} by user ${client.user.id}`,
            );
        } catch (error) {
            this.logger.error(`Failed to send message:`, error.message);
            client.emit('message_error', {
                message: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    }

    @UseGuards(RedisWsThrottleGuard)
    @SubscribeMessage('typing')
    async handleTyping(
        @MessageBody() data: TypingData,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        if (!client.user) return;

        const { questionId, isTyping } = data;
        const userId = client.user.id;

        try {
            const typingKey = `${this.REDIS_KEYS.TYPING_USERS}${questionId}`;

            if (isTyping) {
                await this.redisClient.sAdd(typingKey, userId);
                await this.redisClient.expire(typingKey, 10);
                await this.redisClient.setEx(`${typingKey}:${userId}`, 5, '1');
            } else {
                await this.redisClient.sRem(typingKey, userId);
                await this.redisClient.del(`${typingKey}:${userId}`);
            }

            const typingUsers = await this.redisClient.sMembers(typingKey);

            this.server.to(`question_${questionId}`).emit('typing_status', {
                questionId,
                typingUserIds: typingUsers.filter((id) => id !== userId),
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error('Error handling typing status:', error);
        }
    }

    @SubscribeMessage('mark_as_read')
    async handleMarkAsRead(
        @MessageBody() data: { questionId: string; messageId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        if (!client.user) return;

        try {
            const { questionId, messageId } = data;

            await this.chatService.markMessageAsRead(messageId, client.user.id);

            // Notify sender that message was read
            this.server.to(`question_${questionId}`).emit('message_read', {
                messageId,
                readBy: {
                    id: client.user.id,
                    fullName: client.user.fullName,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error(`Failed to mark message as read:`, error.message);
        }
    }

    // Helper methods
    private async leaveQuestionRoom(
        client: AuthenticatedSocket,
        questionId: string,
    ) {
        if (!client.user) return;

        try {
            client.leave(`question_${questionId}`);

            // Remove from Redis tracking
            const multi = this.redisClient.multi();
            multi.sRem(
                `${this.REDIS_KEYS.QUESTION_USERS}${questionId}`,
                client.user.id,
            );
            multi.sRem(
                `${this.REDIS_KEYS.USER_ROOMS}${client.user.id}`,
                questionId,
            );
            multi.sRem(
                `${this.REDIS_KEYS.TYPING_USERS}${questionId}`,
                client.user.id,
            );
            await multi.exec();

            // Notify others in room
            client.to(`question_${questionId}`).emit('user_left', {
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

    // Public methods for external services
    public async notifyQuestionUpdate(questionId: string, updateData: any) {
        this.server.to(`question_${questionId}`).emit('question_updated', {
            questionId,
            ...updateData,
            timestamp: new Date().toISOString(),
        });
    }

    public async notifyConsultantAssigned(questionId: string, consultant: any) {
        this.server.to(`question_${questionId}`).emit('consultant_assigned', {
            questionId,
            consultant,
            timestamp: new Date().toISOString(),
        });
    }

    public async getOnlineUsersInQuestion(
        questionId: string,
    ): Promise<string[]> {
        try {
            return await this.redisClient.sMembers(
                `${this.REDIS_KEYS.QUESTION_USERS}${questionId}`,
            );
        } catch (error) {
            this.logger.error('Error getting online users:', error);
            return [];
        }
    }

    public async isUserOnline(userId: string): Promise<boolean> {
        try {
            const presence = await this.redisClient.get(
                `${this.REDIS_KEYS.USER_PRESENCE}${userId}`,
            );
            return !!presence;
        } catch (error) {
            this.logger.error('Error checking user online status:', error);
            return false;
        }
    }

    public async getTypingUsers(questionId: string): Promise<string[]> {
        try {
            return await this.redisClient.sMembers(
                `${this.REDIS_KEYS.TYPING_USERS}${questionId}`,
            );
        } catch (error) {
            this.logger.error('Error getting typing users:', error);
            return [];
        }
    }

    // Cleanup method - call this periodically via cron
    public async cleanupExpiredData() {
        try {
            const pattern = `${this.REDIS_KEYS.TYPING_USERS}*`;
            const keys = await this.redisClient.keys(pattern);

            const multi = this.redisClient.multi();

            for (const key of keys) {
                if (key.includes(':')) continue; // Skip individual typing keys

                const members = await this.redisClient.sMembers(key);
                const questionId = key.replace(
                    this.REDIS_KEYS.TYPING_USERS,
                    '',
                );

                // Check each typing user
                for (const userId of members) {
                    const individualKey = `${key}:${userId}`;
                    const exists = await this.redisClient.exists(individualKey);

                    if (!exists) {
                        multi.sRem(key, userId);
                    }
                }
            }

            await multi.exec();
        } catch (error) {
            this.logger.error('Error cleaning up expired data:', error);
        }
    }
}
