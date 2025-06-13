import { registerAs } from '@nestjs/config';

export default registerAs('awsConfig', () => ({
    awsBucketName: process.env.AWS_PUBLIC_BUCKET_NAME,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION,
    awsCloudfrontUrl: process.env.AWS_CLOUDFRONT_URL,
    uploadPath: {
        images: 'uploads/images',
        documents: 'uploads/documents',
        avatars: 'uploads/avatars',
        temp: 'uploads/temp',
    },
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxFileSize: {
        image: 10 * 1024 * 1024, // 10MB
        document: 50 * 1024 * 1024, // 50MB
    },
}));
