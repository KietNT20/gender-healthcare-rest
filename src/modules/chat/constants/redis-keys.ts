// Redis Key Patterns
export const REDIS_KEYS = {
    USER_PRESENCE: 'chat:user:presence:',
    QUESTION_USERS: 'chat:question:users:',
    TYPING_USERS: 'chat:question:typing:',
    USER_ROOMS: 'chat:user:rooms:',
} as const;

// TTL Values (in seconds)
export const TTL_VALUES = {
    USER_PRESENCE: 300, // 5 minutes
    QUESTION_USERS: 3600, // 60 minutes
    USER_ROOMS: 3600, // 60 minutes
    TYPING_STATUS: 10, // 10 seconds
    INDIVIDUAL_TYPING: 5, // 5 seconds
} as const;
