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
import { ConsultantProfile } from '../consultant-profiles/entities/consultant-profile.entity';
import { CHAT_EVENTS, RESPONSE_STATUS } from './constants/chat.constants';
import { CreateChatDto } from './dto/create-chat.dto';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsRoomAccessGuard } from './guards/ws-room-access.guard';
import { RedisWsThrottleGuard } from './guards/ws-throttle.guard';
import {
    ConnectionHandler,
    MessageHandler,
    RoomHandler,
    TypingHandler,
} from './handlers';
import {
    AuthenticatedSocket,
    JoinRoomData,
    TypingData,
} from './interfaces/chat.interface';
import {
    convertToWsException,
    getWsErrorMessage,
} from './utils/exception.utils';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
    namespace: 'chat',
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
            throw convertToWsException(error);
        }
    }

    async handleDisconnect(client: AuthenticatedSocket) {
        try {
            await this.connectionHandler.handleDisconnect(client, this.server);
        } catch (error) {
            this.logger.error('Error handling disconnect:', error);
        }
    }

    @UseGuards(WsRoomAccessGuard, RedisWsThrottleGuard)
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
            this.logger.error('Error leaving question:', error);

            return {
                status: RESPONSE_STATUS.ERROR,
                message: getWsErrorMessage(error),
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        }
    }

    @UseGuards(WsRoomAccessGuard, RedisWsThrottleGuard)
    @SubscribeMessage(CHAT_EVENTS.SEND_MESSAGE)
    async handleSendMessage(
        @MessageBody() data: CreateChatDto,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            await this.messageHandler.handleSendMessage(
                data,
                client,
                this.server,
            );

            return {
                status: RESPONSE_STATUS.SUCCESS,
                message: 'Message sent successfully',
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error(
                `Failed to send message:`,
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

    @UseGuards(RedisWsThrottleGuard)
    @SubscribeMessage(CHAT_EVENTS.TYPING)
    async handleTyping(
        @MessageBody() data: TypingData,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            await this.typingHandler.handleTyping(data, client, this.server);

            return {
                status: RESPONSE_STATUS.SUCCESS,
                message: 'Typing status updated',
                questionId: data.questionId,
                isTyping: data.isTyping,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error('Error handling typing status:', error);

            return {
                status: RESPONSE_STATUS.ERROR,
                message: getWsErrorMessage(error),
                questionId: data.questionId,
                timestamp: new Date().toISOString(),
            };
        }
    }

    @SubscribeMessage(CHAT_EVENTS.MARK_AS_READ)
    async handleMarkAsRead(
        @MessageBody() data: { questionId: string; messageId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            await this.messageHandler.handleMarkAsRead(
                data,
                client,
                this.server,
            );

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

    // Public methods for external services
    public notifyQuestionUpdate(questionId: string, updateData: any) {
        this.messageHandler.notifyQuestionUpdate(
            questionId,
            updateData,
            this.server,
        );
    }

    public notifyConsultantAssigned(
        questionId: string,
        consultant: ConsultantProfile,
    ) {
        this.messageHandler.notifyConsultantAssigned(
            questionId,
            consultant,
            this.server,
        );
    }

    public async getOnlineUsersInQuestion(
        questionId: string,
    ): Promise<string[]> {
        return await this.roomHandler.getOnlineUsersInQuestion(questionId);
    }

    public async isUserOnline(userId: string): Promise<boolean> {
        return await this.connectionHandler.isUserOnline(userId);
    }

    public async getTypingUsers(questionId: string): Promise<string[]> {
        return await this.typingHandler.getTypingUsers(questionId);
    }

    // Cleanup method - call this periodically via cron
    public async cleanupExpiredData() {
        await this.typingHandler.cleanupExpiredData();
    }

    // Cleanup offline users and their related data
    public async cleanupOfflineUsers() {
        await this.connectionHandler.cleanupOfflineUsers();
    }

    // Cleanup completed chat rooms
    public async cleanupCompletedChatRooms() {
        await this.connectionHandler.cleanupCompletedChatRooms();
    }
}
