import { registerAs } from '@nestjs/config';

export default registerAs('awsConfig', () => ({
    // Credentials for AWS SDK
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },

    // AWS Region
    awsRegion: process.env.AWS_REGION,

    // Public bucket for images, avatars
    publicBucket: {
        name: process.env.AWS_PUBLIC_BUCKET_NAME,
        cloudfrontUrl: process.env.AWS_PUBLIC_CLOUDFRONT_URL,
    },

    // Private bucket for documents, temp files
    privateBucket: {
        name: process.env.AWS_PRIVATE_BUCKET_NAME,
        cloudfrontUrl: process.env.AWS_PRIVATE_CLOUDFRONT_URL,
    },

    uploadPath: {
        images: 'images', // -> public bucket
        avatars: 'avatars', // -> public bucket
        documents: 'documents', // -> private bucket
        temp: 'temp', // -> private bucket
    },

    // File type configurations
    allowedImageTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
    ],
    allowedDocumentTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/json',
    ],

    // Max file sizes
    maxFileSize: {
        image: 10 * 1024 * 1024, // 10MB
        document: 50 * 1024 * 1024, // 50MB
        temp: 10 * 1024 * 1024, // 10MB
    },
}));