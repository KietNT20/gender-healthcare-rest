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
