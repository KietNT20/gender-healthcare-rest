import { InjectQueue } from '@nestjs/bullmq';
import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { ReminderFrequencyType, ReminderStatusType } from 'src/enums';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateContraceptiveReminderDto } from './dto/create-contraceptive-reminder.dto';
import { UpdateContraceptiveReminderDto } from './dto/update-contraceptive-reminder.dto';
import { ContraceptiveReminder } from './entities/contraceptive-reminder.entity';

@Injectable()
export class ContraceptiveRemindersService {
    private readonly logger = new Logger(ContraceptiveRemindersService.name);

    constructor(
        @InjectRepository(ContraceptiveReminder)
        private readonly reminderRepository: Repository<ContraceptiveReminder>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectQueue('notification-queue')
        private notificationQueue: Queue,
    ) {}

    async create(
        userId: string,
        createDto: CreateContraceptiveReminderDto,
    ): Promise<ContraceptiveReminder> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException(
                `Không tìm thấy người dùng với ID ${userId}`,
            );
        }

        const reminder = this.reminderRepository.create({
            ...createDto,
            user,
            status: ReminderStatusType.ACTIVE,
        });

        const savedReminder = await this.reminderRepository.save(reminder);
        await this.scheduleReminder(savedReminder, user);

        return savedReminder;
    }

    async findAll(userId: string): Promise<ContraceptiveReminder[]> {
        return this.reminderRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, userId: string): Promise<ContraceptiveReminder> {
        const reminder = await this.reminderRepository.findOne({
            where: { id, user: { id: userId } },
        });
        if (!reminder) {
            throw new NotFoundException(`Không tìm thấy nhắc nhở với ID ${id}`);
        }
        return reminder;
    }

    async update(
        id: string,
        userId: string,
        updateDto: UpdateContraceptiveReminderDto,
    ): Promise<ContraceptiveReminder> {
        const reminder = await this.findOne(id, userId);
        const user = await this.userRepository.findOneBy({ id: userId });

        if (!user) {
            throw new NotFoundException(`Không tìm thấy người dùng`);
        }

        // Hủy job cũ trước khi cập nhật
        await this.cancelReminder(id);

        this.reminderRepository.merge(reminder, updateDto);
        const updatedReminder = await this.reminderRepository.save(reminder);

        // Lên lịch lại nếu nhắc nhở đang active
        if (updatedReminder.status === ReminderStatusType.ACTIVE) {
            await this.scheduleReminder(updatedReminder, user);
        }

        return updatedReminder;
    }

    async remove(id: string, userId: string): Promise<void> {
        const reminder = await this.findOne(id, userId);

        // Hủy job trong queue
        await this.cancelReminder(id);

        await this.reminderRepository.softDelete(reminder.id);
    }

    private async scheduleReminder(
        reminder: ContraceptiveReminder,
        user: User,
    ) {
        const jobId = `contraceptive-${reminder.id}`;

        // Cấu hình lặp lại dựa trên tần suất
        const repeatOpts = {
            pattern: '', // cron pattern
        };

        const [hour, minute] = reminder.reminderTime.split(':').map(Number);

        switch (reminder.frequency) {
            case ReminderFrequencyType.DAILY:
                repeatOpts.pattern = `${minute} ${hour} * * *`;
                break;
            case ReminderFrequencyType.WEEKLY:
                if (!reminder.daysOfWeek || reminder.daysOfWeek.length === 0) {
                    throw new BadRequestException(
                        'Days of week are required for weekly reminders.',
                    );
                }
                repeatOpts.pattern = `${minute} ${hour} * * ${reminder.daysOfWeek.join(',')}`;
                break;
            // Thêm logic cho MONTHLY nếu cần
            default:
                this.logger.warn(
                    `Tần suất nhắc nhở không được hỗ trợ: ${reminder.frequency}`,
                );
                return;
        }

        await this.notificationQueue.add(
            'send-notification',
            {
                userId: user.id,
                type: 'contraceptive',
                title: `Nhắc nhở: ${reminder.contraceptiveType}`,
                content:
                    reminder.reminderMessage ||
                    `Đã đến giờ uống thuốc ${reminder.contraceptiveType}.`,
                email: user.email,
                userName: `${user.firstName} ${user.lastName}`,
                contraceptiveType: reminder.contraceptiveType,
            },
            {
                jobId,
                repeat: repeatOpts,
                removeOnComplete: false, // Giữ job để có thể hủy
                removeOnFail: true,
            },
        );
        this.logger.log(
            `Đã lên lịch nhắc nhở ${jobId} với cron: ${repeatOpts.pattern}`,
        );
    }

    private async cancelReminder(reminderId: string) {
        const jobId = `contraceptive-${reminderId}`;
        const job = await this.notificationQueue.getJob(jobId);
        if (job) {
            // Hủy job lặp lại
            const repeatableJobs =
                await this.notificationQueue.getRepeatableJobs();
            const jobToCancel = repeatableJobs.find((j) => j.id === jobId);
            if (jobToCancel) {
                await this.notificationQueue.removeRepeatableByKey(
                    jobToCancel.key,
                );
                this.logger.log(`Đã hủy job lặp lại: ${jobId}`);
            }
        }
    }
}
