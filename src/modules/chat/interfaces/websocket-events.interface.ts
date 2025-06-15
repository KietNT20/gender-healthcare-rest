export interface WebSocketMessage {
    event: string;
    data: any;
    timestamp: string;
    questionId?: string;
    userId?: string;
}

export interface TypingIndicator {
    questionId: string;
    userId: string;
    userName: string;
    isTyping: boolean;
    timestamp: string;
}

export interface UserJoinedRoom {
    questionId: string;
    userId: string;
    userName: string;
    timestamp: string;
}

export interface UserLeftRoom {
    questionId: string;
    userId: string;
    userName: string;
    timestamp: string;
}

export interface NewMessageBroadcast {
    messageId: string;
    content: string;
    type: string;
    questionId: string;
    sender: {
        id: string;
        fullName: string;
        role: string;
    };
    timestamp: string;
}

export interface MessageReadUpdate {
    messageId: string;
    questionId: string;
    readBy: string;
    timestamp: string;
}

export interface QuestionUpdate {
    questionId: string;
    updateType: 'status_change' | 'consultant_assigned' | 'priority_change';
    updateData: any;
    timestamp: string;
}
