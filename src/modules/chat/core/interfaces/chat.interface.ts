import { User } from '../../../users/entities/user.entity';
import { Question } from '../../entities/question.entity';

export interface ChatMessage {
    id: string;
    questionId: string;
    senderId: string;
    sender: User;
    content: string;
    messageType: 'text' | 'file' | 'image';
    fileUrl?: string;
    fileName?: string;
    createdAt: Date;
    readBy: string[];
}

export interface ChatRoom {
    questionId: string;
    question: Question;
    participants: User[];
    messages: ChatMessage[];
    lastMessage?: ChatMessage;
    unreadCount: number;
}

export interface TypingStatus {
    userId: string;
    username: string;
    isTyping: boolean;
    timestamp: Date;
}

export interface UserPresence {
    userId: string;
    username: string;
    isOnline: boolean;
    lastSeen: Date;
    currentRooms: string[];
}

export interface ChatNotification {
    type:
        | 'new_message'
        | 'user_joined'
        | 'user_left'
        | 'typing'
        | 'message_read';
    questionId: string;
    data: any;
    timestamp: Date;
}
