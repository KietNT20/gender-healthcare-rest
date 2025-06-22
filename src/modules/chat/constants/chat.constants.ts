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

    // Error Events (Legacy - will be replaced by acknowledgements)
    JOIN_ERROR: 'join_error',
    MESSAGE_ERROR: 'message_error',
} as const;

// Redis Key Patterns
export const REDIS_KEYS = {
    USER_PRESENCE: 'chat:user:presence:',
    QUESTION_USERS: 'chat:question:users:',
    TYPING_USERS: 'chat:question:typing:',
    USER_ROOMS: 'chat:user:rooms:',
} as const;

// Room Name Patterns
export const ROOM_PATTERNS = {
    QUESTION_ROOM: 'question_',
} as const;

// TTL Values (in seconds)
export const TTL_VALUES = {
    USER_PRESENCE: 300, // 5 minutes
    QUESTION_USERS: 3600, // 1 hour
    USER_ROOMS: 3600, // 1 hour
    TYPING_STATUS: 10, // 10 seconds
    INDIVIDUAL_TYPING: 5, // 5 seconds
} as const;

// Error Messages
export const ERROR_MESSAGES = {
    USER_NOT_AUTHENTICATED: 'Người dùng chưa đăng nhập',
    ACCESS_DENIED: 'Truy cập bị từ chối vào câu hỏi này',
    INVALID_REQUEST: 'Dữ liệu yêu cầu không hợp lệ',
    AUTHENTICATION_REQUIRED: 'Yêu cầu xác thực',
    ACCESS_DENIED_RESOURCE: 'Truy cập bị từ chối vào tài nguyên này',
    INTERNAL_ERROR: 'Đã xảy ra lỗi',
    CONNECTION_FAILED: 'Kết nối thất bại',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
    CONNECTION_SUCCESS: 'Kết nối thành công',
    JOIN_SUCCESS: 'Tham gia câu hỏi thành công',
    MESSAGE_SENT: 'Tin nhắn đã được gửi thành công',
    MESSAGE_READ: 'Tin nhắn đã được đánh dấu đã đọc',
} as const;

// Response Status
export const RESPONSE_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
} as const;

// Message Types (if not already defined in enums)
export const MESSAGE_TYPES = {
    TEXT: 'text',
    FILE: 'file',
    IMAGE: 'image',
    AUDIO: 'audio',
    VIDEO: 'video',
} as const;
