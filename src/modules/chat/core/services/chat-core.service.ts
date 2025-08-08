import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageType } from 'src/enums';
import { Repository } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { Message } from '../../entities/message.entity';
import { Question } from '../../entities/question.entity';
import { ChatMessage, ChatRoom } from '../interfaces/chat.interface';

@Injectable()
export class ChatCoreService {
    private readonly logger = new Logger(ChatCoreService.name);

    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async createMessage(
        questionId: string,
        senderId: string,
        content: string,
        messageType: 'text' | 'file' | 'image' = 'text',
        fileUrl?: string,
        fileName?: string,
    ): Promise<ChatMessage> {
        // Find the question first
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
        });
        if (!question) {
            throw new Error('Question not found');
        }

        // Find the sender
        const sender = await this.userRepository.findOne({
            where: { id: senderId },
        });
        if (!sender) {
            throw new Error('Sender not found');
        }

        // Convert messageType to MessageType enum
        let type: MessageType;
        switch (messageType) {
            case 'text':
                type = MessageType.TEXT;
                break;
            case 'image':
                type = MessageType.IMAGE;
                break;
            case 'file':
                type = MessageType.FILE;
                break;
            default:
                type = MessageType.TEXT;
        }

        const message = this.messageRepository.create({
            question,
            sender,
            content,
            type,
            metadata: {
                fileId: fileUrl,
                fileName,
            },
        });

        const savedMessage = await this.messageRepository.save(message);

        return {
            id: savedMessage.id,
            questionId: savedMessage.question.id,
            senderId: savedMessage.sender.id,
            sender: savedMessage.sender,
            content: savedMessage.content,
            messageType,
            fileUrl: savedMessage.metadata?.fileId,
            fileName: savedMessage.metadata?.fileName,
            createdAt: savedMessage.createdAt,
            readBy: [], // Initialize as empty array since we're using isRead boolean
        };
    }

    async getMessages(
        questionId: string,
        limit: number = 50,
        offset: number = 0,
    ): Promise<ChatMessage[]> {
        const messages = await this.messageRepository.find({
            where: { question: { id: questionId } },
            relations: ['sender', 'question'],
            order: { createdAt: 'DESC' },
            skip: offset,
            take: limit,
        });

        return messages.map((message) => ({
            id: message.id,
            questionId: message.question.id,
            senderId: message.sender.id,
            sender: message.sender,
            content: message.content,
            messageType: message.type as 'text' | 'file' | 'image',
            fileUrl: message.metadata?.fileId,
            fileName: message.metadata?.fileName,
            createdAt: message.createdAt,
            readBy: [], // Since we're using isRead boolean, return empty array
        }));
    }

    async markMessageAsRead(messageId: string): Promise<void> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
        });
        if (!message) {
            throw new Error('Message not found');
        }

        if (!message.isRead) {
            message.isRead = true;
            message.readAt = new Date();
            await this.messageRepository.save(message);
        }
    }

    async getChatRoom(questionId: string): Promise<ChatRoom> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: ['user'],
        });

        if (!question) {
            throw new Error('Question not found');
        }

        const messages = await this.getMessages(questionId, 1);
        const participants = [question.user];

        return {
            questionId,
            question,
            participants,
            messages,
            lastMessage: messages[0] || null,
            unreadCount: 0, // Will be calculated based on user
        };
    }

    async validateUserAccess(
        questionId: string,
        userId: string,
    ): Promise<boolean> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: ['user'],
        });

        if (!question) {
            return false;
        }

        // User can access if they are the question owner
        return question.user.id === userId;
    }

    async getUnreadCount(questionId: string, userId: string): Promise<number> {
        const messages = await this.messageRepository.find({
            where: { question: { id: questionId } },
            relations: ['sender'],
        });

        return messages.filter(
            (message) => message.sender.id !== userId && !message.isRead,
        ).length;
    }
}
