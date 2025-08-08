import { Injectable, Logger } from '@nestjs/common';
import {
    CHAT_EVENTS,
    RESPONSE_STATUS,
    ROOM_PATTERNS,
} from '../../constants/events';
import { SUCCESS_MESSAGES } from '../../constants/messages';
import {
    AuthenticatedSocket,
    MessageData,
    ReadMessageData,
} from '../../core/interfaces/socket.interface';
import { ChatCoreService } from '../../core/services/chat-core.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class MessageHandler {
    private readonly logger = new Logger(MessageHandler.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly chatCoreService: ChatCoreService,
    ) {}

    async handleSendMessage(
        data: MessageData,
        client: AuthenticatedSocket,
    ): Promise<void> {
        try {
            const {
                questionId,
                content,
                messageType = 'text',
                fileUrl,
                fileName,
            } = data;
            const userId = client.data.userId;
            const username = client.data.user?.firstName || 'Unknown User';

            // Validate user is in the room
            const isInRoom = await this.redisService.isUserInRoom(
                questionId,
                userId as string,
            );
            if (!isInRoom) {
                throw new Error('User is not in the room');
            }

            // Create message in database
            const message = await this.chatCoreService.createMessage(
                questionId,
                userId as string,
                content,
                messageType,
                fileUrl,
                fileName,
            );

            // Prepare message payload
            const messagePayload = {
                id: message.id,
                questionId: message.questionId,
                senderId: message.senderId,
                sender: {
                    id: message.sender.id,
                    firstName: message.sender.firstName,
                    lastName: message.sender.lastName,
                    profilePicture: message.sender.profilePicture,
                },
                content: message.content,
                messageType: message.messageType,
                fileUrl: message.fileUrl,
                fileName: message.fileName,
                createdAt: message.createdAt,
                readBy: message.readBy,
            };

            // Send message to room
            const roomName = `${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`;
            client.to(roomName).emit(CHAT_EVENTS.NEW_MESSAGE, {
                message: messagePayload,
                timestamp: new Date().toISOString(),
            });

            // Send confirmation to sender
            client.emit(CHAT_EVENTS.NEW_MESSAGE, {
                message: messagePayload,
                status: RESPONSE_STATUS.SUCCESS,
                successMessage: SUCCESS_MESSAGES.MESSAGE_SENT,
                timestamp: new Date().toISOString(),
            });

            this.logger.log(
                `Message sent by ${username} in question ${questionId}`,
            );
        } catch (error) {
            this.logger.error(
                `Error sending message in question ${data.questionId}:`,
                error,
            );
            throw error;
        }
    }

    async handleMarkAsRead(
        data: ReadMessageData,
        client: AuthenticatedSocket,
    ): Promise<void> {
        try {
            const { questionId, messageId } = data;
            const userId = client.data.userId;
            const username = client.data.user?.firstName || 'Unknown User';

            // Validate user is in the room
            const isInRoom = await this.redisService.isUserInRoom(
                questionId,
                userId as string,
            );
            if (!isInRoom) {
                throw new Error('User is not in the room');
            }

            // Mark message as read
            await this.chatCoreService.markMessageAsRead(messageId);

            // Notify other users in the room
            const roomName = `${ROOM_PATTERNS.QUESTION_ROOM}${questionId}`;
            client.to(roomName).emit(CHAT_EVENTS.MESSAGE_READ, {
                messageId,
                readBy: userId,
                username,
                questionId,
                timestamp: new Date().toISOString(),
            });

            // Send confirmation to sender
            client.emit(CHAT_EVENTS.MESSAGE_READ, {
                messageId,
                status: RESPONSE_STATUS.SUCCESS,
                successMessage: SUCCESS_MESSAGES.MESSAGE_READ,
                timestamp: new Date().toISOString(),
            });

            this.logger.log(
                `Message ${messageId} marked as read by ${username}`,
            );
        } catch (error) {
            this.logger.error(`Error marking message as read:`, error);
            throw error;
        }
    }

    async getMessages(
        questionId: string,
        limit: number = 50,
        offset: number = 0,
    ): Promise<any[]> {
        return await this.chatCoreService.getMessages(
            questionId,
            limit,
            offset,
        );
    }

    async getUnreadCount(questionId: string, userId: string): Promise<number> {
        return await this.chatCoreService.getUnreadCount(questionId, userId);
    }
}
