import {
    ForbiddenException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { Server } from 'socket.io';
import { MessageType } from 'src/enums';
import { ChatService } from '../chat.service';
import {
    CHAT_EVENTS,
    ERROR_MESSAGES,
    ROOM_PATTERNS,
} from '../constants/chat.constants';
import { CreateChatDto } from '../dto/create-chat.dto';
import { AuthenticatedSocket } from '../interfaces/chat.interface';

@Injectable()
export class MessageHandler {
    private readonly logger = new Logger(MessageHandler.name);

    constructor(private readonly chatService: ChatService) {}

    async handleSendMessage(
        data: CreateChatDto & { questionId: string },
        client: AuthenticatedSocket,
        server: Server,
    ) {
        if (!client.user) {
            throw new UnauthorizedException(
                ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
            );
        }

        try {
            const { questionId, content, type = MessageType.TEXT } = data;

            // Verify user has access to this question
            const hasAccess = await this.chatService.verifyQuestionAccess(
                questionId,
                client.user.id,
            );

            if (!hasAccess) {
                throw new ForbiddenException(ERROR_MESSAGES.ACCESS_DENIED);
            }

            // Save message to database
            const message = await this.chatService.createMessage({
                content,
                type,
                questionId,
                senderId: client.user.id,
            });

            // Broadcast message to room
            server
                .to(`${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`)
                .emit(CHAT_EVENTS.NEW_MESSAGE, {
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
            throw error;
        }
    }

    async handleMarkAsRead(
        data: { questionId: string; messageId: string },
        client: AuthenticatedSocket,
        server: Server,
    ) {
        if (!client.user) return;

        try {
            const { questionId, messageId } = data;

            await this.chatService.markMessageAsRead(messageId, client.user.id);

            // Notify sender that message was read
            server
                .to(`${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`)
                .emit(CHAT_EVENTS.MESSAGE_READ, {
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

    async notifyQuestionUpdate(
        questionId: string,
        updateData: any,
        server: Server,
    ) {
        server
            .to(`${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`)
            .emit(CHAT_EVENTS.QUESTION_UPDATED, {
                questionId,
                ...updateData,
                timestamp: new Date().toISOString(),
            });
    }

    async notifyConsultantAssigned(
        questionId: string,
        consultant: any,
        server: Server,
    ) {
        server
            .to(`${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`)
            .emit(CHAT_EVENTS.CONSULTANT_ASSIGNED, {
                questionId,
                consultant,
                timestamp: new Date().toISOString(),
            });
    }
}
