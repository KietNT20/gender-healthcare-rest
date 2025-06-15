import { Logger } from '@nestjs/common';
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
import { Server, Socket } from 'socket.io';
import { MessageType } from 'src/enums';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

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

@WebSocketGateway({
    namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private connectedUsers = new Map<string, AuthenticatedSocket>(); // userId -> socket
    private questionRooms = new Map<string, Set<string>>(); // questionId -> Set of userIds
    private typingUsers = new Map<string, Set<string>>(); // questionId -> Set of typing userIds

    constructor(
        private readonly authService: AuthService,
        private readonly chatService: ChatService,
    ) {}

    async handleConnection(client: AuthenticatedSocket) {
        try {
            this.logger.log(`Client attempting to connect: ${client.id}`);

            // Extract token from query or handshake
            const token =
                client.handshake.auth?.token || client.handshake.query?.token;

            if (!token) {
                throw new WsException('No authentication token provided');
            }

            // Verify and get user info
            const user = await this.authService.verifyTokenForWebSocket(
                token as string,
            );

            if (!user) {
                throw new WsException('Invalid authentication token');
            }

            // Attach user to socket
            client.user = user;
            this.connectedUsers.set(user.id, client);

            // Send connection success
            client.emit('connected', {
                success: true,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    role: user.role,
                },
                timestamp: new Date().toISOString(),
            });

            this.logger.log(`User connected: ${user.id} (${user.fullName})`);
        } catch (error) {
            this.logger.error(
                `Connection failed for ${client.id}:`,
                error.message,
            );
            client.emit('connection_error', {
                message: 'Authentication failed',
                timestamp: new Date().toISOString(),
            });
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        if (client.user) {
            // Remove from connected users
            this.connectedUsers.delete(client.user.id);

            // Remove from all question rooms
            if (client.questionId) {
                this.leaveQuestionRoom(client, client.questionId);
            }

            // Remove from typing indicators
            this.typingUsers.forEach((typingSet, questionId) => {
                if (typingSet.has(client.user!.id)) {
                    typingSet.delete(client.user!.id);
                    // Notify others that user stopped typing
                    this.broadcastToRoom(
                        questionId,
                        'user_stopped_typing',
                        {
                            userId: client.user!.id,
                            userName: client.user!.fullName,
                            questionId,
                        },
                        client.user!.id,
                    );
                }
            });

            this.logger.log(
                `User disconnected: ${client.user.id} (${client.user.fullName})`,
            );
        }
    }

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
                this.leaveQuestionRoom(client, client.questionId);
            }

            // Join new room
            client.join(`question_${questionId}`);
            client.questionId = questionId;

            // Add to room tracking
            if (!this.questionRooms.has(questionId)) {
                this.questionRooms.set(questionId, new Set());
            }
            this.questionRooms.get(questionId)!.add(client.user.id);

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
        this.leaveQuestionRoom(client, questionId);
    }

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
            this.broadcastToRoom(`question_${questionId}`, 'new_message', {
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

    @SubscribeMessage('typing')
    async handleTyping(
        @MessageBody() data: TypingData,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        if (!client.user) return;

        const { questionId, isTyping } = data;

        // Update typing status
        if (!this.typingUsers.has(questionId)) {
            this.typingUsers.set(questionId, new Set());
        }

        const typingSet = this.typingUsers.get(questionId)!;

        if (isTyping) {
            typingSet.add(client.user.id);
        } else {
            typingSet.delete(client.user.id);
        }

        // Broadcast typing status to room (exclude sender)
        const eventName = isTyping ? 'user_typing' : 'user_stopped_typing';
        this.broadcastToRoom(
            questionId,
            eventName,
            {
                userId: client.user.id,
                userName: client.user.fullName,
                questionId,
                timestamp: new Date().toISOString(),
            },
            client.user.id,
        );
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
            this.broadcastToRoom(
                questionId,
                'message_read',
                {
                    messageId,
                    readBy: {
                        id: client.user.id,
                        fullName: client.user.fullName,
                    },
                    timestamp: new Date().toISOString(),
                },
                client.user.id,
            );
        } catch (error) {
            this.logger.error(`Failed to mark message as read:`, error.message);
        }
    }

    // Helper methods
    private leaveQuestionRoom(client: AuthenticatedSocket, questionId: string) {
        if (!client.user) return;

        client.leave(`question_${questionId}`);

        // Remove from room tracking
        if (this.questionRooms.has(questionId)) {
            this.questionRooms.get(questionId)!.delete(client.user.id);
            if (this.questionRooms.get(questionId)!.size === 0) {
                this.questionRooms.delete(questionId);
            }
        }

        // Remove from typing
        if (this.typingUsers.has(questionId)) {
            this.typingUsers.get(questionId)!.delete(client.user.id);
        }

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
    }

    private broadcastToRoom(
        questionId: string,
        event: string,
        data: any,
        excludeUserId?: string,
    ) {
        if (excludeUserId) {
            // Broadcast to all in room except excluded user
            const excludedSocket = this.connectedUsers.get(excludeUserId);
            if (excludedSocket) {
                excludedSocket.to(`question_${questionId}`).emit(event, data);
            } else {
                this.server.to(`question_${questionId}`).emit(event, data);
            }
        } else {
            this.server.to(`question_${questionId}`).emit(event, data);
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

    public getOnlineUsersInQuestion(questionId: string): string[] {
        return Array.from(this.questionRooms.get(questionId) || new Set());
    }

    public isUserOnline(userId: string): boolean {
        return this.connectedUsers.has(userId);
    }
}
