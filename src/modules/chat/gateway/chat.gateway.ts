import { Logger, UseGuards } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { REGEX } from 'src/constant';
import { ConsultantProfile } from '../../consultant-profiles/entities/consultant-profile.entity';
import { CHAT_EVENTS, RESPONSE_STATUS } from '../constants/events';
import { WsAuthGuard } from '../core/guards/ws-auth.guard';
import { WsRoomAccessGuard } from '../core/guards/ws-room-access.guard';
import { WsThrottleGuard } from '../core/guards/ws-throttle.guard';
import {
    AuthenticatedSocket,
    JoinRoomData,
    MessageData,
    ReadMessageData,
    TypingData,
} from '../core/interfaces/socket.interface';
import { getWsErrorMessage } from '../utils/exception.utils';
import {
    ConnectionHandler,
    MessageHandler,
    RoomHandler,
    TypingHandler,
} from './handlers';

@UseGuards(WsAuthGuard)
@WebSocketGateway({
    namespace: 'chat',
    cors: {
        origin: [REGEX.LOCALHOST, process.env.FRONTEND_URL],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly connectionHandler: ConnectionHandler,
        private readonly roomHandler: RoomHandler,
        private readonly messageHandler: MessageHandler,
        private readonly typingHandler: TypingHandler,
    ) {}

    async handleConnection(client: AuthenticatedSocket) {
        try {
            await this.connectionHandler.handleConnection(client, this.server);
        } catch (error) {
            this.logger.error('Error handling connection:', error);
            client.emit('error', {
                status: RESPONSE_STATUS.ERROR,
                message: getWsErrorMessage(error),
                timestamp: new Date().toISOString(),
            });
        }
    }

    async handleDisconnect(client: AuthenticatedSocket) {
        try {
            await this.connectionHandler.handleDisconnect(client, this.server);
        } catch (error) {
            this.logger.error('Error handling disconnect:', error);
        }
    }

    @UseGuards(WsRoomAccessGuard, WsThrottleGuard)
    @SubscribeMessage(CHAT_EVENTS.JOIN_QUESTION)
    async handleJoinQuestion(
        @MessageBody() data: JoinRoomData,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            await this.roomHandler.handleJoinQuestion(data, client);

            // Send success acknowledgement
            return {
                status: RESPONSE_STATUS.SUCCESS,
                message: 'Successfully joined question',
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error(
                `Failed to join question ${data.questionId}:`,
                error instanceof Error ? error.message : String(error),
            );

            // Send error acknowledgement
            return {
                status: RESPONSE_STATUS.ERROR,
                message: getWsErrorMessage(error),
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        }
    }

    @UseGuards(WsRoomAccessGuard, WsThrottleGuard)
    @SubscribeMessage(CHAT_EVENTS.LEAVE_QUESTION)
    async handleLeaveQuestion(
        @MessageBody() data: JoinRoomData,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            await this.roomHandler.handleLeaveQuestion(data, client);

            return {
                status: RESPONSE_STATUS.SUCCESS,
                message: 'Successfully left question',
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error(
                `Failed to leave question ${data.questionId}:`,
                error instanceof Error ? error.message : String(error),
            );

            return {
                status: RESPONSE_STATUS.ERROR,
                message: getWsErrorMessage(error),
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        }
    }

    @UseGuards(WsRoomAccessGuard, WsThrottleGuard)
    @SubscribeMessage(CHAT_EVENTS.SEND_MESSAGE)
    async handleSendMessage(
        @MessageBody() data: MessageData,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            await this.messageHandler.handleSendMessage(data, client);

            return {
                status: RESPONSE_STATUS.SUCCESS,
                message: 'Message sent successfully',
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error(
                `Failed to send message in question ${data.questionId}:`,
                error instanceof Error ? error.message : String(error),
            );

            return {
                status: RESPONSE_STATUS.ERROR,
                message: getWsErrorMessage(error),
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        }
    }

    @UseGuards(WsRoomAccessGuard, WsThrottleGuard)
    @SubscribeMessage(CHAT_EVENTS.TYPING)
    async handleTyping(
        @MessageBody() data: TypingData,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            await this.typingHandler.handleTyping(data, client);

            return {
                status: RESPONSE_STATUS.SUCCESS,
                message: 'Typing status updated',
                questionId: data.questionId,
                isTyping: data.isTyping,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error(
                `Failed to update typing status in question ${data.questionId}:`,
                error instanceof Error ? error.message : String(error),
            );

            return {
                status: RESPONSE_STATUS.ERROR,
                message: getWsErrorMessage(error),
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        }
    }

    @UseGuards(WsRoomAccessGuard, WsThrottleGuard)
    @SubscribeMessage(CHAT_EVENTS.MARK_AS_READ)
    async handleMarkAsRead(
        @MessageBody() data: ReadMessageData,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            await this.messageHandler.handleMarkAsRead(data, client);

            return {
                status: RESPONSE_STATUS.SUCCESS,
                message: 'Message marked as read',
                messageId: data.messageId,
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error(
                `Failed to mark message as read:`,
                error instanceof Error ? error.message : String(error),
            );

            return {
                status: RESPONSE_STATUS.ERROR,
                message: getWsErrorMessage(error),
                messageId: data.messageId,
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        }
    }

    // Public methods for external use
    public notifyQuestionUpdate(questionId: string, updateData: any) {
        const roomName = `question_${questionId}`;
        this.server.to(roomName).emit(CHAT_EVENTS.QUESTION_UPDATED, {
            questionId,
            updateData,
            timestamp: new Date().toISOString(),
        });
    }

    public notifyConsultantAssigned(
        questionId: string,
        consultant: ConsultantProfile,
    ) {
        const roomName = `question_${questionId}`;
        this.server.to(roomName).emit(CHAT_EVENTS.CONSULTANT_ASSIGNED, {
            questionId,
            consultant: {
                id: consultant.id,
                username: consultant.user
                    ? `${consultant.user.firstName} ${consultant.user.lastName}`
                    : '',
                avatar: consultant.user?.profilePicture,
            },
            timestamp: new Date().toISOString(),
        });
    }

    public async getOnlineUsersInQuestion(
        questionId: string,
    ): Promise<string[]> {
        return await this.roomHandler.getOnlineUsersInQuestion(questionId);
    }

    public async isUserOnline(userId: string): Promise<boolean> {
        const presence =
            await this.connectionHandler['redisService'].getUserPresence(
                userId,
            );
        return presence?.isOnline || false;
    }

    public async getTypingUsers(questionId: string): Promise<string[]> {
        return await this.typingHandler.getTypingUsers(questionId);
    }

    public cleanupExpiredData() {
        this.connectionHandler['redisService'].cleanupExpiredData();
    }

    public cleanupOfflineUsers() {
        // This can be implemented based on your requirements
        this.logger.log('Cleaning up offline users');
    }

    public cleanupCompletedChatRooms() {
        // This can be implemented based on your requirements
        this.logger.log('Cleaning up completed chat rooms');
    }
}
