import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from 'src/constant';
import { SortOrder } from 'src/enums';
import { MenstrualPredictionsService } from 'src/modules/menstrual-predictions/menstrual-predictions.service';
import { NotificationType } from 'src/modules/notifications/processors/notification.processor';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
    CreateMenstrualCycleResponseDto,
    IrregularityAlert,
} from './dto/create-menstrual-cycle-response.dto';
import { CreateMenstrualCycleDto } from './dto/create-menstrual-cycle.dto';
import { UpdateMenstrualCycleDto } from './dto/update-menstrual-cycle.dto';
import { MenstrualCycle } from './entities/menstrual-cycle.entity';

@Injectable()
export class MenstrualCyclesService {
    constructor(
        @InjectRepository(MenstrualCycle)
        private readonly cycleRepository: Repository<MenstrualCycle>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly predictionsService: MenstrualPredictionsService,
        @InjectQueue(QUEUE_NAMES.NOTIFICATION_QUEUE)
        private readonly notificationQueue: Queue,
    ) {}

    async create(
        userId: string,
        createDto: CreateMenstrualCycleDto,
    ): Promise<CreateMenstrualCycleResponseDto> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException(
                `Không tìm thấy người dùng với ID ${userId}`,
            );
        }

        const startDate = new Date(createDto.cycleStartDate);
        const endDate = new Date(createDto.cycleEndDate);

        // Tính toán độ dài kỳ kinh
        const periodLength =
            Math.floor(
                (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
            ) + 1;

        // Tìm chu kỳ gần nhất trước đó để tính độ dài chu kỳ
        const lastCycle = await this.cycleRepository.findOne({
            where: { user: { id: userId } },
            order: { cycleStartDate: SortOrder.DESC },
        });

        let cycleLength: number | undefined;
        if (lastCycle) {
            cycleLength = Math.floor(
                (startDate.getTime() -
                    new Date(lastCycle.cycleStartDate).getTime()) /
                    (1000 * 3600 * 24),
            );
        }

        // Cập nhật độ dài cho chu kỳ trước đó nếu có
        if (lastCycle) {
            await this.cycleRepository.update(lastCycle.id, { cycleLength });
        }

        // Tạo và lưu chu kỳ mới
        const newCycle = this.cycleRepository.create({
            user,
            cycleStartDate: startDate,
            cycleEndDate: endDate,
            periodLength,
            // cycleLength sẽ được cập nhật khi chu kỳ tiếp theo được tạo
        });

        const savedCycle = await this.cycleRepository.save(newCycle);

        // Kiểm tra rối loạn để thông báo
        const irregularityAlert = await this.checkAndNotifyIrregularity(
            userId,
            savedCycle,
        );

        // Kích hoạt dịch vụ dự đoán sau khi tạo chu kỳ mới
        await this.predictionsService.predictAndUpdate(userId);

        return {
            cycle: savedCycle,
            irregularityAlert,
        };
    }

    async findAll(userId: string): Promise<MenstrualCycle[]> {
        return this.cycleRepository.find({
            where: { user: { id: userId } },
            order: { cycleStartDate: SortOrder.DESC },
        });
    }

    async findOne(id: string, userId: string): Promise<MenstrualCycle> {
        const cycle = await this.cycleRepository.findOne({
            where: { id, user: { id: userId } },
        });
        if (!cycle) {
            throw new NotFoundException(`Không tìm thấy chu kỳ với ID ${id}`);
        }
        return cycle;
    }

    async update(
        id: string,
        userId: string,
        updateDto: UpdateMenstrualCycleDto,
    ): Promise<MenstrualCycle> {
        const cycle = await this.findOne(id, userId);

        this.cycleRepository.merge(cycle, updateDto);
        const updatedCycle = await this.cycleRepository.save(cycle);

        // Kích hoạt lại dự đoán nếu ngày bắt đầu/kết thúc thay đổi
        if (updateDto.cycleStartDate || updateDto.cycleEndDate) {
            await this.predictionsService.predictAndUpdate(userId);
        }

        return updatedCycle;
    }

    async remove(id: string, userId: string): Promise<void> {
        const cycle = await this.findOne(id, userId);
        await this.cycleRepository.softDelete(cycle.id);
        await this.predictionsService.predictAndUpdate(userId);
    }

    // Kiểm tra rối loạn chu kỳ: nếu có chu kỳ lệch quá threshold ngày so với trung bình thì coi là rối loạn
    private isIrregularCycle(
        cycles: MenstrualCycle[] = [],
        threshold = 7,
    ): boolean {
        if (!Array.isArray(cycles) || cycles.length < 2) return false;
        const cycleLengths = cycles
            .map((c) => c?.cycleLength)
            .filter(
                (length): length is number =>
                    typeof length === 'number' && length > 0,
            );
        if (cycleLengths.length < 2) return false;
        const avg =
            cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
        return cycleLengths.some(
            (length) => Math.abs(length - avg) > threshold,
        );
    }

    // Phân tích rối loạn để thông báo
    private async checkAndNotifyIrregularity(
        userId: string,
        currentCycle: MenstrualCycle,
    ): Promise<IrregularityAlert | undefined> {
        try {
            // Lấy tất cả chu kỳ của user
            const allCycles = await this.cycleRepository.find({
                where: { user: { id: userId } },
                order: { cycleStartDate: SortOrder.DESC },
            });

            let isIrregular = false;

            // Nếu có ít nhất 2 chu kỳ → so sánh với nhau
            if (allCycles.length >= 2) {
                isIrregular = this.isIrregularCycle(allCycles);
            }
            // Nếu chỉ có 1 chu kỳ → so sánh với chu kỳ trung bình (28 ngày)
            else if (allCycles.length === 1 && currentCycle.cycleLength) {
                const avgCycleLength = 28; // Chu kỳ trung bình
                const threshold = 7; // Ngưỡng chấp nhận

                isIrregular =
                    Math.abs(currentCycle.cycleLength - avgCycleLength) >
                    threshold;
            }

            // Nếu phát hiện rối loạn
            if (isIrregular) {
                console.log(
                    `Phát hiện rối loạn chu kỳ cho user ${userId}, cycle ID: ${currentCycle.id}`,
                );

                // Lấy thông tin user để gửi notification
                const user = await this.userRepository.findOneBy({
                    id: userId,
                });
                if (user) {
                    await this.sendIrregularCycleNotification(
                        user,
                        currentCycle,
                    );
                }

                return this.createIrregularityAlert();
            }

            return undefined;
        } catch (error) {
            // Log lỗi nhưng không ảnh hưởng đến việc lưu chu kỳ
            console.error('Lỗi khi kiểm tra rối loạn chu kỳ:', error);
            return undefined;
        }
    }

    // Tạo thông báo rối loạn
    private createIrregularityAlert(): IrregularityAlert {
        return {
            type: 'CYCLE_LENGTH_VARIATION',
            message:
                'Chu kỳ này có dấu hiệu bất thường so với các chu kỳ trước.',
            recommendation:
                'Bạn nên theo dõi và tham khảo ý kiến bác sĩ nếu cần.',
        };
    }

    // Gửi thông báo rối loạn chu kỳ
    private async sendIrregularCycleNotification(
        user: User,
        cycle: MenstrualCycle,
    ): Promise<void> {
        try {
            await this.notificationQueue.add('send-notification', {
                userId: user.id,
                type: NotificationType.IRREGULAR_CYCLE_ALERT,
                title: 'Cảnh báo: Chu kỳ kinh nguyệt bất thường',
                content:
                    'Chu kỳ kinh nguyệt của bạn có dấu hiệu bất thường so với các chu kỳ trước. Vui lòng theo dõi và tham khảo ý kiến bác sĩ nếu cần.',
                actionUrl: `/menstrual-cycles/${cycle.id}`,
            });

            console.log(`Đã gửi thông báo rối loạn chu kỳ cho user ${user.id}`);
        } catch (error) {
            console.error('Lỗi khi gửi thông báo rối loạn chu kỳ:', error);
        }
    }
}
