import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from 'src/constant';
import { ContentStatusType, PriorityType } from 'src/enums';
import { Blog } from '../blogs/entities/blog.entity';

export interface BlogNotificationData {
    blogId: string;
    blogTitle: string;
    status: ContentStatusType;
    authorId: string;
    reviewerId?: string;
    publisherId?: string;
    rejectionReason?: string;
    revisionNotes?: string;
}

@Injectable()
export class BlogNotificationService {
    constructor(
        @InjectQueue(QUEUE_NAMES.BLOG_NOTIFICATION)
        private notificationQueue: Queue,
    ) {}

    /**
     * Thông báo khi blog được submit for review
     */
    async notifyBlogSubmittedForReview(blog: Blog): Promise<void> {
        await this.notificationQueue.add('send-blog-notification', {
            notificationData: {
                userId: blog.author.id,
                title: '📝 Blog đã được gửi để duyệt',
                content: `Blog "${blog.title}" của bạn đã được gửi để duyệt. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.`,
                type: 'BLOG_SUBMITTED',
                priority: PriorityType.NORMAL,
                actionUrl: `/blogs/${blog.id}`,
            },
        });
    }

    /**
     * Thông báo khi blog được approve
     */
    async notifyBlogApproved(blog: Blog): Promise<void> {
        await this.notificationQueue.add('send-blog-notification', {
            notificationData: {
                userId: blog.author.id,
                title: '✅ Bài viết đã được duyệt',
                content: `Chúc mừng! Bài viết "${blog.title}" của bạn đã được duyệt và sẵn sàng để công khai.`,
                type: 'BLOG_APPROVED',
                priority: PriorityType.HIGH,
                actionUrl: `/blogs/${blog.id}`,
            },
        });
    }

    /**
     * Thông báo khi blog bị reject
     */
    async notifyBlogRejected(
        blog: Blog,
        reviewerId: string,
        rejectionReason?: string,
    ): Promise<void> {
        const reasonText = rejectionReason
            ? `\n\nLý do từ chối: ${rejectionReason}`
            : '';

        await this.notificationQueue.add('send-blog-notification', {
            notificationData: {
                userId: blog.author.id,
                title: '❌ Bài viết bị từ chối',
                content: `Bài viết "${blog.title}" của bạn đã bị từ chối.${reasonText}\n\nBạn có thể chỉnh sửa và gửi lại để duyệt.`,
                type: 'BLOG_REJECTED',
                priority: PriorityType.HIGH,
                actionUrl: `/blogs/${blog.id}`,
            },
        });
    }

    /**
     * Thông báo khi blog cần revision
     */
    async notifyBlogNeedsRevision(
        blog: Blog,
        revisionNotes?: string,
    ): Promise<void> {
        const notesText = revisionNotes ? `\n\nGhi chú: ${revisionNotes}` : '';
        await this.notificationQueue.add('send-blog-notification', {
            notificationData: {
                userId: blog.author.id,
                title: '✏️ Bài viết cần chỉnh sửa',
                content: `Bài viết "${blog.title}" của bạn cần chỉnh sửa thêm.${notesText}\n\nVui lòng cập nhật và gửi lại để duyệt.`,
                type: 'BLOG_NEEDS_REVISION',
                priority: PriorityType.NORMAL,
                actionUrl: `/blogs/${blog.id}`,
            },
        });
    }

    /**
     * Thông báo khi blog được publish
     */
    async notifyBlogPublished(blog: Blog): Promise<void> {
        await this.notificationQueue.add('send-blog-notification', {
            notificationData: {
                userId: blog.author.id,
                title: '🚀 Bài viết đã được xuất bản',
                content: `Tuyệt vời! Bài viết "${blog.title}" của bạn đã được xuất bản và có thể xem công khai.`,
                type: 'BLOG_PUBLISHED',
                priority: PriorityType.HIGH,
                actionUrl: `/blogs/public/slug/${blog.slug}`,
            },
        });
    }

    /**
     * Thông báo khi blog được archive
     */
    async notifyBlogArchived(blog: Blog): Promise<void> {
        await this.notificationQueue.add('send-blog-notification', {
            notificationData: {
                userId: blog.author.id,
                title: '📦 Bài viết đã được lưu trữ',
                content: `Bài viết "${blog.title}" của bạn đã được chuyển vào lưu trữ.`,
                type: 'BLOG_ARCHIVED',
                priority: PriorityType.LOW,
                actionUrl: `/blogs/${blog.id}`,
            },
        });
    }

    /**
     * Thông báo khi blog đạt milestone views
     */
    async notifyBlogViewsMilestone(
        blog: Blog,
        milestone: number,
    ): Promise<void> {
        await this.notificationQueue.add('send-blog-notification', {
            notificationData: {
                userId: blog.author.id,
                title: '👀 Bài viết đạt milestone lượt xem',
                content: `Chúc mừng! Bài viết "${blog.title}" của bạn đã đạt ${milestone.toLocaleString()} lượt xem.`,
                type: 'BLOG_VIEWS_MILESTONE',
                priority: PriorityType.NORMAL,
                actionUrl: `/blogs/public/slug/${blog.slug}`,
            },
        });
    }

    /**
     * Thông báo tổng hợp cho admin về các blog cần review
     */
    async notifyAdminBlogsPendingReview(
        adminIds: string[],
        pendingCount: number,
    ): Promise<void> {
        const jobs = adminIds.map((adminId) =>
            this.notificationQueue.add('send-blog-notification', {
                notificationData: {
                    userId: adminId,
                    title: '📋 Có blog cần duyệt',
                    content: `Hiện có ${pendingCount} blog đang chờ duyệt. Vui lòng kiểm tra và xử lý.`,
                    type: 'ADMIN_BLOGS_PENDING',
                    priority: PriorityType.NORMAL,
                    actionUrl: '/admin/blogs?status=pending_review',
                },
            }),
        );
        await Promise.all(jobs);
    }
}
