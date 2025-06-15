import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageType, RolesNameEnum } from 'src/enums';
import { Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import { Message } from '../messages/entities/message.entity';
import { Question } from '../questions/entities/question.entity';
import { User } from '../users/entities/user.entity';
import {
    CreateMessageData,
    MessageWithSender,
} from './interfaces/chat.interface';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly filesService: FilesService,
    ) {}

    /**
     * Verify if user has access to a specific question
     */
    async verifyQuestionAccess(
        questionId: string,
        userId: string,
    ): Promise<boolean> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: ['user'],
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Question owner always has access
        if (question.user.id === userId) {
            return true;
        }

        // Consultants can access all questions
        if (user.role?.name === RolesNameEnum.CONSULTANT) {
            return true;
        }

        // Staff, managers, and admins can access all questions
        if (
            [
                RolesNameEnum.STAFF,
                RolesNameEnum.MANAGER,
                RolesNameEnum.ADMIN,
            ].includes(user.role?.name)
        ) {
            return true;
        }

        return false;
    }

    /**
     * Create a new message
     */
    async createMessage(data: CreateMessageData): Promise<MessageWithSender> {
        const { content, type, questionId, senderId, fileData } = data;

        // Verify question exists and user has access
        const hasAccess = await this.verifyQuestionAccess(questionId, senderId);
        if (!hasAccess) {
            throw new ForbiddenException('Access denied to this question');
        }

        // Get question and sender info
        const [question, sender] = await Promise.all([
            this.questionRepository.findOne({ where: { id: questionId } }),
            this.userRepository.findOne({
                where: { id: senderId },
                relations: ['role'],
            }),
        ]);

        if (!question || !sender) {
            throw new NotFoundException('Question or sender not found');
        }

        // Validate message content based on type
        this.validateMessageContent(content, type);

        // Create message
        const message = this.messageRepository.create({
            content,
            type,
            question,
            sender,
            isRead: false,
        });

        // If it's a file message, validate and store file info
        if (type === MessageType.FILE && fileData) {
            // Store file reference in content as JSON
            message.content = JSON.stringify({
                text: content,
                file: fileData,
            });
        }

        const savedMessage = await this.messageRepository.save(message);

        // Return message with sender info
        return {
            ...savedMessage,
            sender: {
                id: sender.id,
                fullName: `${sender.firstName} ${sender.lastName}`,
                role: sender.role?.name || 'user',
                profilePicture: sender.profilePicture,
            },
        };
    }

    /**
     * Get message history for a question
     */
    async getMessageHistory(
        questionId: string,
        page: number = 1,
        limit: number = 50,
    ): Promise<MessageWithSender[]> {
        const messages = await this.messageRepository.find({
            where: { question: { id: questionId } },
            relations: ['sender', 'sender.role'],
            order: { createdAt: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return messages.map((message) => ({
            ...message,
            sender: {
                id: message.sender.id,
                fullName: `${message.sender.firstName} ${message.sender.lastName}`,
                role: message.sender.role?.name || 'user',
                profilePicture: message.sender.profilePicture,
            },
        }));
    }

    /**
     * Mark message as read
     */
    async markMessageAsRead(messageId: string, userId: string): Promise<void> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['sender', 'question'],
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Don't mark own messages as read
        if (message.sender.id === userId) {
            return;
        }

        // Verify user has access to this question
        const hasAccess = await this.verifyQuestionAccess(
            message.question.id,
            userId,
        );
        if (!hasAccess) {
            throw new ForbiddenException('Access denied');
        }

        // Update message as read
        await this.messageRepository.update(messageId, {
            isRead: true,
            updatedAt: new Date(),
        });
    }

    /**
     * Mark all messages in a question as read for a user
     */
    async markAllMessagesAsRead(
        questionId: string,
        userId: string,
    ): Promise<void> {
        // Verify access
        const hasAccess = await this.verifyQuestionAccess(questionId, userId);
        if (!hasAccess) {
            throw new ForbiddenException('Access denied');
        }

        // Mark all unread messages as read (except own messages)
        await this.messageRepository
            .createQueryBuilder()
            .update(Message)
            .set({ isRead: true, updatedAt: new Date() })
            .where('question.id = :questionId', { questionId })
            .andWhere('sender.id != :userId', { userId })
            .andWhere('isRead = false')
            .execute();
    }

    /**
     * Get unread message count for a user across all questions
     */
    async getUnreadMessageCount(userId: string): Promise<number> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        let query = this.messageRepository
            .createQueryBuilder('message')
            .leftJoin('message.question', 'question')
            .leftJoin('message.sender', 'sender')
            .where('message.isRead = false')
            .andWhere('sender.id != :userId', { userId });

        // For customers, only count messages from their own questions
        if (user.role?.name === RolesNameEnum.CUSTOMER) {
            query = query.andWhere('question.user.id = :userId', { userId });
        }

        return query.getCount();
    }

    /**
     * Update question activity timestamp
     */
    async updateQuestionActivity(questionId: string): Promise<void> {
        await this.questionRepository.update(questionId, {
            updatedAt: new Date(),
        });
    }

    /**
     * Send message with file attachment
     */
    async sendMessageWithFile(
        questionId: string,
        senderId: string,
        content: string,
        file: Express.Multer.File,
        type: MessageType = MessageType.FILE,
    ): Promise<MessageWithSender> {
        try {
            // Determine entity type based on message type
            let entityType = 'message';
            if (type === MessageType.IMAGE) {
                entityType = 'message_image';
            }

            // Upload file
            let uploadResult;
            if (type === MessageType.IMAGE) {
                uploadResult = await this.filesService.uploadImage({
                    file,
                    entityType,
                    entityId: questionId,
                    isPublic: false, // Chat files are private
                    generateThumbnails: true,
                });
            } else {
                uploadResult = await this.filesService.uploadDocument({
                    file,
                    entityType,
                    entityId: questionId,
                    description: `File sent in chat: ${content}`,
                    isSensitive: false,
                });
            }

            // Create message with file data
            return await this.createMessage({
                content,
                type,
                questionId,
                senderId,
                fileData: {
                    fileId: uploadResult.id,
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to send message with file:`, error);
            throw error;
        }
    }

    /**
     * Get file access URL for message attachments
     */
    async getMessageFileUrl(
        messageId: string,
        userId: string,
    ): Promise<string> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['question'],
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Verify access
        const hasAccess = await this.verifyQuestionAccess(
            message.question.id,
            userId,
        );
        if (!hasAccess) {
            throw new ForbiddenException('Access denied');
        }

        // Parse file data from content
        if (
            message.type === MessageType.FILE ||
            message.type === MessageType.IMAGE
        ) {
            try {
                const fileData = JSON.parse(message.content);
                if (fileData.file && fileData.file.fileId) {
                    if (message.type === MessageType.IMAGE) {
                        const imageWithUrl =
                            await this.filesService.getImageWithAccessUrl(
                                fileData.file.fileId,
                                3600, // 1 hour expiry
                            );
                        return imageWithUrl.accessUrl;
                    } else {
                        const docWithUrl =
                            await this.filesService.getDocumentWithAccessUrl(
                                fileData.file.fileId,
                                3600, // 1 hour expiry
                            );
                        return docWithUrl.accessUrl;
                    }
                }
            } catch (error) {
                this.logger.error(
                    `Failed to parse file data from message ${messageId}:`,
                    error,
                );
            }
        }

        throw new NotFoundException('File not found');
    }

    /**
     * Delete a message (soft delete)
     */
    async deleteMessage(messageId: string, userId: string): Promise<void> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['sender', 'question'],
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Only sender or admins can delete messages
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });

        const canDelete =
            message.sender.id === userId ||
            [RolesNameEnum.ADMIN, RolesNameEnum.MANAGER].includes(
                user?.role?.name as RolesNameEnum,
            );

        if (!canDelete) {
            throw new ForbiddenException('Cannot delete this message');
        }

        await this.messageRepository.softDelete(messageId);
    }

    /**
     * Get question summary with last message
     */
    async getQuestionChatSummary(questionId: string): Promise<{
        question: Question;
        lastMessage?: MessageWithSender;
        unreadCount: number;
    }> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: ['user', 'category'],
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        // Get last message
        const lastMessage = await this.messageRepository.findOne({
            where: { question: { id: questionId } },
            relations: ['sender', 'sender.role'],
            order: { createdAt: 'DESC' },
        });

        // Get unread count
        const unreadCount = await this.messageRepository.count({
            where: {
                question: { id: questionId },
                isRead: false,
            },
        });

        return {
            question,
            lastMessage: lastMessage
                ? {
                      ...lastMessage,
                      sender: {
                          id: lastMessage.sender.id,
                          fullName: `${lastMessage.sender.firstName} ${lastMessage.sender.lastName}`,
                          role: lastMessage.sender.role?.name || 'user',
                          profilePicture: lastMessage.sender.profilePicture,
                      },
                  }
                : undefined,
            unreadCount,
        };
    }

    /**
     * Validate message content based on type
     */
    private validateMessageContent(content: string, type: MessageType): void {
        if (!content || content.trim().length === 0) {
            throw new BadRequestException('Message content cannot be empty');
        }

        if (content.length > 5000) {
            throw new BadRequestException(
                'Message content too long (max 5000 characters)',
            );
        }

        // Additional validation for specific types
        if (type === MessageType.FILE || type === MessageType.IMAGE) {
            // For file messages, content should be JSON or a description
            if (content.length > 500) {
                throw new BadRequestException(
                    'File message description too long (max 500 characters)',
                );
            }
        }
    }
}
