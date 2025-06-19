import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { MenstrualCycle } from 'src/modules/menstrual-cycles/entities/menstrual-cycle.entity';
import { IsNull, Repository } from 'typeorm';
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
            where: { user: { id: userId }, deletedAt: IsNull() },
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

        // Bắt đầu tính toán các ngày dự đoán
        const predictedNextPeriodStart = this.addDays(
            lastCycleStartDate,
            avgCycleLength,
        );

        const predictedNextPeriodEnd = this.addDays(
            predictedNextPeriodStart,
            avgPeriodLength - 1,
        );

        const predictedOvulationDate = this.addDays(
            predictedNextPeriodStart,
            -14,
        );
        const predictedFertileStart = this.addDays(predictedOvulationDate, -5);
        const predictedFertileEnd = this.addDays(predictedOvulationDate, 1);
        // Kết thúc tính toán

        let prediction = await this.predictionRepository.findOne({
            where: { user: { id: userId } },
        });

        if (!prediction) {
            prediction = this.predictionRepository.create({
                user: { id: userId },
            });
        }

        const updatedPredictionData = {
            predictedCycleStart: predictedNextPeriodStart,
            predictedCycleEnd: predictedNextPeriodEnd,
            predictedOvulationDate,
            predictedFertileStart,
            predictedFertileEnd,
        };

        this.predictionRepository.merge(prediction, updatedPredictionData);

        const savedPrediction =
            await this.predictionRepository.save(prediction);
        this.logger.log(`Đã cập nhật dự đoán cho người dùng ${userId}`);

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
            notificationDate.setDate(notificationDate.getDate() - 1);
            notificationDate.setHours(9, 0, 0, 0);

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
                        jobId: `prediction-${notif.type}-${userId}`,
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
            // Correctly find and remove scheduled (delayed) jobs
            const jobs = await this.notificationQueue.getJobs(['delayed']);
            for (const job of jobs) {
                if (job.id === jobId) {
                    await job.remove();
                    this.logger.log(`Đã xóa job cũ: ${jobId}`);
                }
            }
        }
    }

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
