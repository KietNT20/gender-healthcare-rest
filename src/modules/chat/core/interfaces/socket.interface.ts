import { Socket } from 'socket.io';
import { User } from '../../../users/entities/user.entity';

export interface AuthenticatedSocket extends Socket {
    user: User;
    userId: string;
    userRole: string;
}

export interface JoinRoomData {
    questionId: string;
}

export interface TypingData {
    questionId: string;
    isTyping: boolean;
}

export interface MessageData {
    questionId: string;
    content: string;
    messageType?: 'text' | 'file' | 'image';
    fileUrl?: string;
    fileName?: string;
}

export interface ReadMessageData {
    questionId: string;
    messageId: string;
}
