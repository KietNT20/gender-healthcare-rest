import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import {
    MessageType,
    QuestionStatusType,
    RolesNameEnum,
    SortOrder,
} from 'src/enums';
import { EntityManager, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Appointment } from '../appointments/entities/appointment.entity';
import { FilesService } from '../files/files.service';
import { FileResult } from '../files/interfaces';
import { User } from '../users/entities/user.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SendFileMessageDto } from './dto/send-file-messsage.dto';
import { Message } from './entities/message.entity';
import { Question } from './entities/question.entity';
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
            relations: {
                user: true,
                appointment: {
                    consultant: true,
                },
            },
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: {
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Question owner (customer) always has access
        if (question.user.id === userId) {
            return true;
        }

        // Only the assigned consultant of the appointment can access the question
        if (question.appointment?.consultant?.id === userId) {
            return true;
        }

        // Staff, managers, and admins can access all questions (for moderation purposes)
        if (
            [
                RolesNameEnum.STAFF,
                RolesNameEnum.MANAGER,
                RolesNameEnum.ADMIN,
            ].includes(user.role?.name)
        ) {
            return true;
        }

        // All other users (including other consultants) are denied access
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
                relations: {
                    role: true,
                },
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
        if (
            (type === MessageType.FILE || type === MessageType.IMAGE) &&
            fileData
        ) {
            message.metadata = {
                fileId: fileData.fileId,
                fileName: fileData.fileName,
                fileSize: fileData.fileSize,
                mimeType: fileData.mimeType,
                ...(fileData.isDocument !== undefined && {
                    isDocument: fileData.isDocument,
                }),
                ...(fileData.isPublicPdf !== undefined && {
                    isPublicPdf: fileData.isPublicPdf,
                }),
                ...(fileData.publicUrl && { publicUrl: fileData.publicUrl }),
            };
            message.content = fileData.fileName;
        }

        const savedMessage = await this.messageRepository.save(message);

        return {
            ...savedMessage,
            sender: {
                id: sender.id,
                fullName: `${sender.firstName} ${sender.lastName}`,
                role: sender.role?.name,
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
            relations: {
                sender: {
                    role: true,
                },
            },
            order: { createdAt: SortOrder.ASC },
            skip: (page - 1) * limit,
            take: limit,
        });

        return messages.map((message) => ({
            ...message,
            sender: {
                id: message.sender.id,
                fullName: `${message.sender.firstName} ${message.sender.lastName}`,
                role: message.sender.role?.name,
                profilePicture: message.sender.profilePicture,
            },
        }));
    }

    /**
     * Get message history with enhanced file URLs for a question
     */
    async getMessageHistoryWithFileUrls(
        questionId: string,
        userId: string,
        page: number = 1,
        limit: number = 50,
    ): Promise<MessageWithSender[]> {
        // First get the regular message history
        const messages = await this.getMessageHistory(questionId, page, limit);

        // Enhance messages with file URLs where applicable
        const enhancedMessages = await Promise.all(
            messages.map(async (message) => {
                // If it's a file-type message, try to get the file URL
                if (
                    message.type === MessageType.FILE ||
                    message.type === MessageType.IMAGE ||
                    message.type === MessageType.PUBLIC_PDF
                ) {
                    try {
                        if (
                            message.type === MessageType.PUBLIC_PDF &&
                            message.metadata?.publicUrl
                        ) {
                            // For public PDFs, use the stored public URL
                            return {
                                ...message,
                                fileUrl: message.metadata.publicUrl as string,
                            };
                        } else if (message.metadata?.fileId) {
                            // For other files, get the access URL
                            const fileUrl = await this.getMessageFileUrl(
                                message.id,
                                userId,
                            );
                            return {
                                ...message,
                                fileUrl,
                            };
                        }
                    } catch (error) {
                        this.logger.warn(
                            `Failed to get file URL for message ${message.id}:`,
                            error.message,
                        );
                    }
                }
                return message;
            }),
        );

        return enhancedMessages;
    }

    /**
     * Mark message as read
     */
    async markMessageAsRead(messageId: string, userId: string): Promise<void> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: {
                sender: true,
                question: true,
            },
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
     * Get unread message count for a user across all questions they have access to
     */
    async getUnreadMessageCount(userId: string): Promise<number> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: {
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        let query = this.messageRepository
            .createQueryBuilder('message')
            .leftJoin('message.question', 'question')
            .leftJoin('message.sender', 'sender')
            .leftJoin('question.appointment', 'appointment')
            .where('message.isRead = false')
            .andWhere('sender.id != :userId', { userId });

        // For customers, only count messages from their own questions
        if (user.role?.name === RolesNameEnum.CUSTOMER) {
            query = query.andWhere('question.user.id = :userId', { userId });
        }
        // For consultants, only count messages from questions where they are the assigned consultant
        else if (user.role?.name === RolesNameEnum.CONSULTANT) {
            query = query.andWhere('appointment.consultant.id = :userId', {
                userId,
            });
        }
        // For staff, managers, and admins, count messages from all questions (they have access to all)
        else if (
            [
                RolesNameEnum.STAFF,
                RolesNameEnum.MANAGER,
                RolesNameEnum.ADMIN,
            ].includes(user.role?.name)
        ) {
            query = query.andWhere('question.status != :status', {
                status: QuestionStatusType.CLOSED,
            });
        } else {
            return 0;
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
        file: Express.Multer.File,
        sendFileMessageDto: SendFileMessageDto,
    ): Promise<MessageWithSender> {
        try {
            let uploadResult: FileResult;
            let messageType: MessageType;

            if (
                sendFileMessageDto.type === MessageType.IMAGE ||
                file.mimetype.startsWith('image/')
            ) {
                // Use uploadImage for actual image files
                uploadResult = await this.filesService.uploadImage({
                    file,
                    entityType: 'message_image',
                    entityId: questionId,
                    isPublic: false,
                    generateThumbnails: true,
                });
                messageType = MessageType.IMAGE;
            } else {
                // Use uploadDocument for non-image files (FILE type)
                uploadResult = await this.filesService.uploadDocument({
                    file,
                    entityType: 'message_document',
                    entityId: questionId,
                    description:
                        sendFileMessageDto.content || file.originalname,
                });
                // Use IMAGE type in database but mark as document in metadata
                messageType = MessageType.IMAGE;
            }

            return await this.createMessage({
                content: sendFileMessageDto.content || file.originalname,
                type:
                    sendFileMessageDto.type === MessageType.IMAGE
                        ? MessageType.IMAGE
                        : MessageType.FILE,
                questionId,
                senderId,
                fileData: {
                    fileId: uploadResult.id,
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    isDocument: !file.mimetype.startsWith('image/'),
                },
            });
        } catch (error) {
            this.logger.error(`Failed to send message with file:`, error);
            throw error;
        }
    }

    /**
     * Send message with public PDF attachment
     */
    async sendMessageWithPublicPdf(
        questionId: string,
        senderId: string,
        content: string,
        file: Express.Multer.File,
        description?: string,
    ): Promise<MessageWithSender> {
        try {
            // Validate that it's a PDF file
            if (file.mimetype !== 'application/pdf') {
                throw new BadRequestException(
                    'Only PDF files are allowed for public PDF messages',
                );
            }

            // Verify question exists and user has access
            const hasAccess = await this.verifyQuestionAccess(
                questionId,
                senderId,
            );
            if (!hasAccess) {
                throw new ForbiddenException('Access denied to this question');
            }

            // Upload PDF as public PDF
            const uploadResult = await this.filesService.uploadPublicPdf({
                file,
                entityType: 'message_public_pdf',
                entityId: questionId,
                description: description || content || file.originalname,
            });

            return await this.createMessage({
                content: content || file.originalname,
                type: MessageType.PUBLIC_PDF,
                questionId,
                senderId,
                fileData: {
                    fileId: uploadResult.id,
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    isDocument: true,
                    isPublicPdf: true,
                    publicUrl: uploadResult.url,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to send message with public PDF:`, error);
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
            relations: {
                question: true,
            },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        const hasAccess = await this.verifyQuestionAccess(
            message.question.id,
            userId,
        );
        if (!hasAccess) {
            throw new ForbiddenException('Access denied');
        }

        if (
            (message.type === MessageType.FILE ||
                message.type === MessageType.IMAGE ||
                message.type === MessageType.PUBLIC_PDF) &&
            message.metadata?.fileId
        ) {
            try {
                const fileId = message.metadata.fileId;

                if (message.type === MessageType.PUBLIC_PDF) {
                    // For public PDFs, return the stored public URL or get it from service
                    if (message.metadata.publicUrl) {
                        return message.metadata.publicUrl as string;
                    } else {
                        const pdfWithUrl =
                            await this.filesService.getPublicPdfWithAccessUrl(
                                fileId,
                            );
                        return pdfWithUrl.accessUrl;
                    }
                } else if (message.type === MessageType.IMAGE) {
                    const imageWithUrl =
                        await this.filesService.getImageWithAccessUrl(fileId);
                    return imageWithUrl.accessUrl;
                } else {
                    const docWithUrl =
                        await this.filesService.getDocumentWithAccessUrl(
                            fileId,
                        );
                    return docWithUrl.accessUrl;
                }
            } catch (error) {
                this.logger.error(
                    `Failed to get file URL from message ${messageId}:`,
                    error,
                );
            }
        }

        throw new NotFoundException('File not found in this message');
    }

    /**
     * Delete a message (soft delete)
     */
    async deleteMessage(messageId: string, userId: string): Promise<void> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: {
                sender: true,
                question: true,
            },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Only sender or admins can delete messages
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: {
                role: true,
            },
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
            relations: {
                user: true,
            },
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        // Get last message
        const lastMessage = await this.messageRepository.findOne({
            where: { question: { id: questionId } },
            relations: {
                sender: true,
            },
            order: { createdAt: SortOrder.DESC },
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
                          role: lastMessage.sender.role?.name,
                          profilePicture: lastMessage.sender.profilePicture,
                      },
                  }
                : undefined,
            unreadCount,
        };
    }

    /**
     * Create a new question
     */
    async createQuestion(
        createQuestionDto: CreateQuestionDto,
        userId: string,
        appointmentId?: string,
        entityManager?: EntityManager,
    ): Promise<Question> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Generate unique slug
        const baseSlug = slugify(createQuestionDto.title, {
            lower: true,
            strict: true,
        });
        const slug = `${baseSlug}-${uuidv4().substring(0, 8)}`;

        const questionData: Partial<Question> = {
            ...createQuestionDto,
            user,
            slug,
            status: QuestionStatusType.PENDING,
        };

        // Nếu có appointmentId, gắn với appointment
        if (appointmentId) {
            questionData.appointment = { id: appointmentId } as Appointment;
        }

        const question = this.questionRepository.create(questionData);

        // Sử dụng entityManager nếu được truyền vào (để dùng chung transaction)
        if (entityManager) {
            const savedQuestion = await entityManager.save(Question, question);
            return savedQuestion as Question;
        }

        return this.questionRepository.save(question) as unknown as Question;
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
        if (
            type === MessageType.FILE ||
            type === MessageType.IMAGE ||
            type === MessageType.PUBLIC_PDF
        ) {
            // For file messages, content should be JSON or a description
            if (content.length > 500) {
                throw new BadRequestException(
                    'File message description too long (max 500 characters)',
                );
            }
        }
    }

    /**
     * Get questions that a user has access to
     */
    async getUserAccessibleQuestions(userId: string): Promise<Question[]> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: {
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        let query = this.questionRepository
            .createQueryBuilder('question')
            .leftJoinAndSelect('question.user', 'user')
            .leftJoinAndSelect('question.appointment', 'appointment')
            .leftJoinAndSelect('appointment.consultant', 'consultant')
            .orderBy('question.updatedAt', 'DESC');

        // For customers, only their own questions
        if (user.role?.name === RolesNameEnum.CUSTOMER) {
            query = query.where('question.user.id = :userId', { userId });
        }
        // For consultants, only questions where they are the assigned consultant
        else if (user.role?.name === RolesNameEnum.CONSULTANT) {
            query = query.where('appointment.consultant.id = :userId', {
                userId,
            });
        }
        // For staff, managers, and admins, all questions
        else if (
            [
                RolesNameEnum.STAFF,
                RolesNameEnum.MANAGER,
                RolesNameEnum.ADMIN,
            ].includes(user.role?.name)
        ) {
            // No additional filter needed - they can see all questions
        }
        // For other roles, no access to any questions
        else {
            return [];
        }

        return query.getMany();
    }

    /**
     * Get question by appointment ID
     */
    async getQuestionByAppointmentId(appointmentId: string): Promise<Question> {
        const question = await this.questionRepository.findOne({
            where: { appointment: { id: appointmentId } },
            relations: {
                user: true,
                appointment: true,
            },
        });

        if (!question) {
            throw new NotFoundException(
                'Không tìm thấy câu hỏi của buổi tư vấn này',
            );
        }

        return question;
    }
}
