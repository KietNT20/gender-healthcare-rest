// WebSocket Event Names
export const CHAT_EVENTS = {
    // Client to Server Events
    JOIN_QUESTION: 'join_question',
    LEAVE_QUESTION: 'leave_question',
    SEND_MESSAGE: 'send_message',
    TYPING: 'typing',
    MARK_AS_READ: 'mark_as_read',

    // Server to Client Events
    CONNECTED: 'connected',
    JOINED_QUESTION: 'joined_question',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    NEW_MESSAGE: 'new_message',
    MESSAGE_READ: 'message_read',
    TYPING_STATUS: 'typing_status',
    QUESTION_UPDATED: 'question_updated',
    CONSULTANT_ASSIGNED: 'consultant_assigned',
    CONSULTANT_ONLINE: 'consultant_online',
} as const;

// Room Name Patterns
export const ROOM_PATTERNS = {
    QUESTION_ROOM: 'question_',
} as const;

// Response Status
export const RESPONSE_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
} as const;
