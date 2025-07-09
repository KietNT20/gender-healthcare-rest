import { Socket } from 'socket.io';
import { MessageType } from 'src/enums';
import { Message } from 'src/modules/chat/entities/message.entity';

export interface CreateMessageData {
    content: string;
    type: MessageType;
    questionId: string;
    senderId: string;
    fileData?: {
        fileId: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        isDocument?: boolean; // Flag to distinguish documents from images
        isPublicPdf?: boolean; // Flag to distinguish public PDFs
        publicUrl?: string; // Direct public URL for public PDFs
    };
}

export interface MessageWithSender extends Omit<Message, 'sender'> {
    sender: {
        id: string;
        fullName: string;
        role: string;
        profilePicture?: string;
    };
}

export interface AuthenticatedSocket extends Socket {
    user?: {
        id: string;
        email: string;
        role: string;
        fullName: string;
    };
    questionId?: string;
}

export interface UserPresence {
    userId: string;
    socketId: string;
    fullName: string;
    role: string;
    lastSeen: number;
}

export interface TypingData {
    questionId: string;
    isTyping: boolean;
}

export interface JoinRoomData {
    questionId: string;
}
