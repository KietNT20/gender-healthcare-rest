import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentStatusType, PriorityType, RolesNameEnum } from 'src/enums';
import { IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { BlogNotificationService } from './blog-notification.service';
import { Blog } from './entities/blog.entity';

@Injectable()
export class BlogAdminNotificationService {
    constructor(
        @InjectRepository(Blog)
        private readonly blogRepository: Repository<Blog>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly blogNotificationService: BlogNotificationService,
    ) {}

    /**
     * Chạy cron job mỗi ngày lúc 9:00 AM để thông báo về blogs pending review
     */
    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async sendDailyPendingBlogsNotification() {
        const pendingBlogsCount = await this.blogRepository.count({
            where: {
                status: ContentStatusType.PENDING_REVIEW,
                deletedAt: IsNull(),
            },
        });

        if (pendingBlogsCount > 0) {
            const adminUsers = await this.userRepository.find({
                where: [
                    { role: { name: RolesNameEnum.ADMIN } },
                    { role: { name: RolesNameEnum.MANAGER } },
                ],
                relations: {
                    role: true,
                },
            });

            const adminIds = adminUsers.map((user) => user.id);

            await this.blogNotificationService.notifyAdminBlogsPendingReview(
                adminIds,
                pendingBlogsCount,
            );
        }
    }

    /**
     * Thông báo ngay lập tức khi có blog pending review quá lâu (> 3 ngày)
     */
    @Cron(CronExpression.EVERY_6_HOURS)
    async sendOverduePendingBlogsNotification() {
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
            const adminUsers = await this.userRepository.find({
                where: [
                    { role: { name: RolesNameEnum.ADMIN } },
                    { role: { name: RolesNameEnum.MANAGER } },
                ],
                relations: {
                    role: true,
                },
            });

            const adminIds = adminUsers.map((user) => user.id);

            // Custom notification for overdue blogs
            const promises = adminIds.map((adminId) =>
                this.blogNotificationService['notificationsService'].create({
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
    } /**
     * Thống kê hàng tuần về blog activities
     */
    @Cron('0 9 * * 1') // Every Monday at 9AM
    async sendWeeklyBlogStatistics() {
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

        const adminUsers = await this.userRepository.find({
            where: [
                { role: { name: RolesNameEnum.ADMIN } },
                { role: { name: RolesNameEnum.MANAGER } },
            ],
            relations: {
                role: true,
            },
        });

        const adminIds = adminUsers.map((user) => user.id);

        const promises = adminIds.map((adminId) =>
            this.blogNotificationService['notificationsService'].create({
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
}
