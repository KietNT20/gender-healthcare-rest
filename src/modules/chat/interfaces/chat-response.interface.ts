export interface ChatApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages?: number;
    };
    timestamp?: string;
}

export interface MessageResponse extends ChatApiResponse {
    data: {
        id: string;
        content: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        isRead: boolean;
        sender: {
            id: string;
            fullName: string;
            role: string;
            profilePicture?: string;
        };
    };
}

export interface MessagesListResponse extends ChatApiResponse {
    data: MessageResponse['data'][];
}

export interface ChatStatisticsResponse extends ChatApiResponse {
    data: {
        totalMessages: number;
        unreadMessages: number;
        lastActivityAt: Date;
        participantsCount: number;
    };
}

export interface OnlineUsersResponse extends ChatApiResponse {
    data: {
        onlineUsers: string[];
        totalOnline: number;
    };
}

export interface QuestionSummaryResponse extends ChatApiResponse {
    data: {
        question: {
            id: string;
            title: string;
            content: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
        lastMessage?: MessageResponse['data'];
        unreadCount: number;
    };
}
