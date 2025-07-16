export const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export const REGEX = {
    VN_PHONE: /^((\+84|84|0)(3[2-9]|5[0-9]|7[0-9]|8[1-9]|9[0-9])([0-9]{7}))$/,
    PWD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    TIME_24H: /^([01]\d|2[0-3]):([0-5]\d)$/,
};

export const QUEUE_NAMES = {
    NOTIFICATION_QUEUE: 'notification-queue',
    IMAGE_PROCESSING: 'image-processing',
    APPOINTMENT_NOTIFICATION: 'appointment-notification',
    BLOG_ADMIN_NOTIFICATION: 'blog-admin-notification',
    BLOG_NOTIFICATION: 'blog-notification',
    CONSULTANT_REGISTRATION_NOTIFICATION:
        'consultant-registration-notification',
    STI_TEST_PROCESS_NOTIFICATION: 'sti-test-process-notification',
    TEST_RESULT_NOTIFICATION: 'test-result-notification',
} as const;
