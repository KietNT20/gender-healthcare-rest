import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from 'src/constant';

@Injectable()
export class BlogAdminNotificationService {
    private readonly logger = new Logger(BlogAdminNotificationService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.BLOG_ADMIN_NOTIFICATION)
        private readonly adminBlogQueue: Queue,
    ) {}

    /**
     * Chạy cron job mỗi ngày lúc 9:00 AM để thông báo về blogs pending review
     */
    @Cron(CronExpression.EVERY_DAY_AT_9AM, { name: 'daily_pending_blogs' })
    triggerDailyPendingBlogsNotification() {
        this.logger.log('Triggering daily pending blogs report...');
        this.adminBlogQueue.add(
            'send-daily-pending-report',
            {},
            {
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    /**
     * Thông báo ngay lập tức khi có blog pending review quá lâu (> 3 ngày)
     */
    @Cron(CronExpression.EVERY_6_HOURS, { name: 'overdue_pending_blogs' })
    triggerOverduePendingBlogsNotification() {
        this.logger.log('Triggering overdue pending blogs report...');
        this.adminBlogQueue.add(
            'send-overdue-pending-report',
            {},
            {
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    /**
     * Thống kê hàng tuần về blog activities
     */
    @Cron(CronExpression.EVERY_WEEK, { name: 'weekly_blog_stats' })
    triggerWeeklyBlogStatistics() {
        this.logger.log('Triggering weekly blog statistics report...');
        this.adminBlogQueue.add(
            'send-weekly-stats-report',
            {},
            {
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    /**
     * Thống kê hàng tháng về số blog được tạo, đang chờ duyệt và được duyệt
     */
    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON, {
        name: 'monthly_blog_stats',
    })
    triggerMonthlyBlogStatistics() {
        this.logger.log('Triggering monthly blog statistics report...');
        this.adminBlogQueue.add(
            'send-monthly-stats-report',
            {},
            {
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }
}
