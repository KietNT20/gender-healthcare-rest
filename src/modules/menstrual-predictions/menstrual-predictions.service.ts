import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { MenstrualCycle } from 'src/modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { MenstrualPrediction } from './entities/menstrual-prediction.entity';

@Injectable()
export class MenstrualPredictionsService {
    private readonly logger = new Logger(MenstrualPredictionsService.name);
    private readonly DEFAULT_CYCLE_LENGTH = 28;
    private readonly DEFAULT_PERIOD_LENGTH = 5;

    constructor(
        @InjectRepository(MenstrualCycle)
        private readonly cycleRepository: Repository<MenstrualCycle>,
        @InjectRepository(MenstrualPrediction)
        private readonly predictionRepository: Repository<MenstrualPrediction>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectQueue('notification-queue') private notificationQueue: Queue,
    ) {}

    async predictAndUpdate(
        userId: string,
    ): Promise<MenstrualPrediction | null> {
        this.logger.log(`Bắt đầu dự đoán chu kỳ cho người dùng ${userId}`);

        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            this.logger.warn(`Không tìm thấy người dùng ${userId}`);
            return null;
        }

        const cycles = await this.cycleRepository.find({
            where: { user: { id: userId } },
            order: { cycleStartDate: 'ASC' },
        });

        if (cycles.length < 1) {
            this.logger.warn(
                `Không có dữ liệu chu kỳ cho người dùng ${userId}. Hủy dự đoán.`,
            );
            await this.predictionRepository.delete({ user: { id: userId } });
            await this.removeOldPredictionJobs(userId);
            return null;
        }

        const avgCycleLength = this.calculateAverage(
            cycles,
            'cycleLength',
            this.DEFAULT_CYCLE_LENGTH,
        );
        const avgPeriodLength = this.calculateAverage(
            cycles,
            'periodLength',
            this.DEFAULT_PERIOD_LENGTH,
        );

        const lastCycle = cycles[cycles.length - 1];
        const lastCycleStartDate = new Date(lastCycle.cycleStartDate);

        const predictedNextPeriodStart = this.addDays(
            lastCycleStartDate,
            avgCycleLength,
        );
        const predictedOvulationDate = this.addDays(
            predictedNextPeriodStart,
            -14,
        );
        const predictedFertileStart = this.addDays(predictedOvulationDate, -5);
        const predictedFertileEnd = this.addDays(predictedOvulationDate, 1);

        let prediction = await this.predictionRepository.findOne({
            where: { user: { id: userId } },
        });

        if (!prediction) {
            prediction = this.predictionRepository.create({
                user: { id: userId },
            });
        }

        Object.assign(prediction, {
            predictedCycleStart: predictedNextPeriodStart,
            predictedOvulationDate,
            predictedFertileStart,
            predictedFertileEnd,
        });

        const savedPrediction =
            await this.predictionRepository.save(prediction);
        this.logger.log(`Đã cập nhật dự đoán cho người dùng ${userId}`);

        // Lên lịch thông báo mới
        await this.schedulePredictionNotifications(user, savedPrediction);

        return savedPrediction;
    }

    private calculateAverage(
        cycles: MenstrualCycle[],
        field: 'cycleLength' | 'periodLength',
        defaultValue: number,
    ): number {
        const validCycles = cycles.filter((c) => c[field] && c[field]! > 0);
        if (validCycles.length === 0) return defaultValue;
        const sum = validCycles.reduce((acc, c) => acc + c[field]!, 0);
        return Math.round(sum / validCycles.length);
    }

    private addDays(date: Date, days: number): Date {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    }

    private async schedulePredictionNotifications(
        user: User,
        prediction: MenstrualPrediction,
    ) {
        const userName = `${user.firstName} ${user.lastName}`;
        const userId = user.id;

        // Xóa các jobs cũ của user này để tránh thông báo trùng lặp
        await this.removeOldPredictionJobs(userId);

        const notifications = [
            {
                type: 'period_start',
                date: prediction.predictedCycleStart,
                title: 'Chu kỳ sắp bắt đầu',
                content: `Dự kiến chu kỳ kinh nguyệt của bạn sẽ bắt đầu vào ngày mai.`,
            },
            {
                type: 'fertile_window',
                date: prediction.predictedFertileStart,
                title: 'Thời kỳ thụ thai',
                content: `Giai đoạn có khả năng thụ thai của bạn bắt đầu từ hôm nay.`,
            },
            {
                type: 'ovulation',
                date: prediction.predictedOvulationDate,
                title: 'Ngày rụng trứng',
                content: `Hôm nay là ngày rụng trứng dự kiến của bạn.`,
            },
        ];

        for (const notif of notifications) {
            const notificationDate = new Date(notif.date);
            notificationDate.setDate(notificationDate.getDate() - 1); // Gửi thông báo trước 1 ngày
            notificationDate.setHours(9, 0, 0, 0); // Vào 9h sáng

            const delay = notificationDate.getTime() - Date.now();

            if (delay > 0) {
                await this.notificationQueue.add(
                    'send-notification',
                    {
                        userId: userId,
                        type: notif.type,
                        title: notif.title,
                        content: notif.content,
                        email: user.email,
                        userName: userName,
                        predictedDate: notif.date.toISOString().split('T')[0],
                    },
                    {
                        delay,
                        jobId: `prediction-${notif.type}-${userId}`, // Tạo Job ID duy nhất
                        removeOnComplete: true,
                        removeOnFail: true,
                    },
                );
                this.logger.log(
                    `Đã lên lịch thông báo ${notif.type} cho user ${userId} vào lúc ${notificationDate}`,
                );
            }
        }
    }

    private async removeOldPredictionJobs(userId: string) {
        const jobTypes = ['period_start', 'fertile_window', 'ovulation'];
        for (const type of jobTypes) {
            const jobId = `prediction-${type}-${userId}`;
            const job = await this.notificationQueue.getJob(jobId);
            if (job) {
                await job.remove();
                this.logger.log(`Đã xóa job cũ: ${jobId}`);
            }
        }
    }

    /**
     * Lấy dữ liệu dự đoán cho người dùng hiện tại
     * @param userId ID của người dùng
     * @returns Dữ liệu dự đoán hoặc ném lỗi nếu không tìm thấy
     */
    async getPredictionsForUser(userId: string): Promise<MenstrualPrediction> {
        const prediction = await this.predictionRepository.findOne({
            where: { user: { id: userId } },
        });

        if (!prediction) {
            throw new NotFoundException(
                'Chưa có dữ liệu dự đoán cho người dùng này. Vui lòng ghi nhận ít nhất một chu kỳ kinh nguyệt.',
            );
        }

        return prediction;
    }
}
