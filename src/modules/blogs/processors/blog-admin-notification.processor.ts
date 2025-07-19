import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from 'src/constant';
import { ContentStatusType, PriorityType, RolesNameEnum } from 'src/enums';
import {
    In,
    IsNull,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
} from 'typeorm';
import { NotificationsService } from '../../notifications/notifications.service';
import { User } from '../../users/entities/user.entity';
import { BlogNotificationService } from '../blog-notification.service';
import { Blog } from '../entities/blog.entity';

@Processor(QUEUE_NAMES.BLOG_ADMIN_NOTIFICATION)
export class BlogAdminNotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(BlogAdminNotificationProcessor.name);

    constructor(
        @InjectRepository(Blog)
        private readonly blogRepository: Repository<Blog>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly blogNotificationService: BlogNotificationService,
        private readonly notificationsService: NotificationsService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing job ${job.name} (${job.id})...`);
        try {
            switch (job.name) {
                case 'send-daily-pending-report':
                    await this.sendDailyPendingBlogsNotification();
                    break;
                case 'send-overdue-pending-report':
                    await this.sendOverduePendingBlogsNotification();
                    break;
                case 'send-weekly-stats-report':
                    await this.sendWeeklyBlogStatistics();
                    break;
                case 'send-monthly-stats-report':
                    await this.sendMonthlyBlogStatistics();
                    break;
                default:
                    this.logger.warn(`Unknown job name: ${job.name}`);
            }
            this.logger.log(`Job ${job.name} (${job.id}) completed.`);
        } catch (error) {
            this.logger.error(
                `Job ${job.name} (${job.id}) failed.`,
                error instanceof Error ? error.stack : error,
            );
            throw error;
        }
    }

    private async getAdminIds(): Promise<string[]> {
        const adminUsers = await this.userRepository.find({
            where: {
                role: {
                    name: In([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER]),
                },
            },
            relations: { role: true },
        });
        return adminUsers.map((user) => user.id);
    }

    private async sendDailyPendingBlogsNotification() {
        const pendingBlogsCount = await this.blogRepository.count({
            where: {
                status: ContentStatusType.PENDING_REVIEW,
                deletedAt: IsNull(),
            },
        });

        if (pendingBlogsCount > 0) {
            const adminIds = await this.getAdminIds();
            await this.blogNotificationService.notifyAdminBlogsPendingReview(
                adminIds,
                pendingBlogsCount,
            );
        }
    }

    private async sendOverduePendingBlogsNotification() {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const overdueBlogsCount = await this.blogRepository.count({
            where: {
                status: ContentStatusType.PENDING_REVIEW,
                updatedAt: LessThanOrEqual(threeDaysAgo),
                deletedAt: IsNull(),
            },
        });

        if (overdueBlogsCount > 0) {
            const adminIds = await this.getAdminIds();
            const promises = adminIds.map((adminId) =>
                this.notificationsService.create({
                    userId: adminId,
                    title: '⚠️ Blog quá hạn duyệt',
                    content: `Có ${overdueBlogsCount} blog đã chờ duyệt quá 3 ngày. Vui lòng xử lý khẩn cấp!`,
                    type: 'ADMIN_BLOGS_OVERDUE',
                    priority: PriorityType.URGENT,
                    actionUrl:
                        '/admin/blogs?status=pending_review&overdue=true',
                }),
            );
            await Promise.all(promises);
        }
    }

    private async sendWeeklyBlogStatistics() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [publishedCount, rejectedCount, approvedCount] =
            await Promise.all([
                this.blogRepository.count({
                    where: {
                        status: ContentStatusType.PUBLISHED,
                        publishedAt: MoreThanOrEqual(oneWeekAgo),
                        deletedAt: IsNull(),
                    },
                }),
                this.blogRepository.count({
                    where: {
                        status: ContentStatusType.REJECTED,
                        updatedAt: MoreThanOrEqual(oneWeekAgo),
                        deletedAt: IsNull(),
                    },
                }),
                this.blogRepository.count({
                    where: {
                        status: ContentStatusType.APPROVED,
                        updatedAt: MoreThanOrEqual(oneWeekAgo),
                        deletedAt: IsNull(),
                    },
                }),
            ]);

        const adminIds = await this.getAdminIds();
        const promises = adminIds.map((adminId) =>
            this.notificationsService.create({
                userId: adminId,
                title: '📊 Báo cáo blog tuần này',
                content: `Tuần vừa qua: ${publishedCount} blog xuất bản, ${approvedCount} blog duyệt, ${rejectedCount} blog từ chối.`,
                type: 'ADMIN_WEEKLY_STATS',
                priority: PriorityType.LOW,
                actionUrl: '/admin/dashboard/blog-statistics',
            }),
        );
        await Promise.all(promises);
    }

    private async sendMonthlyBlogStatistics() {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [createdCount, pendingCount, approvedCount] = await Promise.all([
            this.blogRepository.count({
                where: {
                    createdAt: MoreThanOrEqual(firstDayOfMonth),
                    deletedAt: IsNull(),
                },
            }),
            this.blogRepository.count({
                where: {
                    status: ContentStatusType.PENDING_REVIEW,
                    deletedAt: IsNull(),
                },
            }),
            this.blogRepository.count({
                where: {
                    status: ContentStatusType.APPROVED,
                    updatedAt: MoreThanOrEqual(firstDayOfMonth),
                    deletedAt: IsNull(),
                },
            }),
        ]);

        const adminIds = await this.getAdminIds();
        const promises = adminIds.map((adminId) =>
            this.notificationsService.create({
                userId: adminId,
                title: '📈 Báo cáo blog tháng này',
                content: `Tháng này: ${createdCount} blog được tạo, ${pendingCount} blog đang chờ duyệt, ${approvedCount} blog được duyệt.`,
                type: 'ADMIN_MONTHLY_STATS',
                priority: PriorityType.LOW,
                actionUrl: '/admin/dashboard/blog-statistics',
            }),
        );
        await Promise.all(promises);
    }
}
