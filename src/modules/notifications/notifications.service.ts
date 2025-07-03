import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { SortOrder } from 'src/enums';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) {}

    async create(createDto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationRepository.create({
            ...createDto,
            user: { id: createDto.userId },
        });
        return this.notificationRepository.save(notification);
    }

    async findAllForUser(
        userId: string,
        pagination: PaginationDto,
    ): Promise<Paginated<Notification>> {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        const [data, totalItems] =
            await this.notificationRepository.findAndCount({
                where: { user: { id: userId } },
                order: { createdAt: SortOrder.DESC },
                take: limit,
                skip,
            });

        return {
            data,
            meta: {
                itemsPerPage: limit,
                totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
            },
        };
    }

    async getUnreadCount(userId: string): Promise<{ count: number }> {
        const count = await this.notificationRepository.count({
            where: { user: { id: userId }, isRead: false },
        });
        return { count };
    }

    async markAsRead(
        notificationId: string,
        userId: string,
    ): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, user: { id: userId } },
        });

        if (!notification) {
            throw new NotFoundException('Không tìm thấy thông báo.');
        }

        notification.isRead = true;
        notification.readAt = new Date();
        return this.notificationRepository.save(notification);
    }

    async markAllAsRead(userId: string): Promise<{ affected: number }> {
        const result = await this.notificationRepository.update(
            { user: { id: userId }, isRead: false },
            { isRead: true, readAt: new Date() },
        );
        return { affected: result.affected || 0 };
    }

    async remove(notificationId: string, userId: string): Promise<void> {
        const result = await this.notificationRepository.delete({
            id: notificationId,
            user: { id: userId },
        });

        if (result.affected === 0) {
            throw new NotFoundException('Không tìm thấy thông báo để xóa.');
        }
    }
}
