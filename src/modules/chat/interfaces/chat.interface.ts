import { MessageType } from 'src/enums';
import { Message } from 'src/modules/messages/entities/message.entity';

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
