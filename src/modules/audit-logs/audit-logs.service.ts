import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { SortOrder } from 'src/enums';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
    private readonly logger = new Logger(AuditLogsService.name);

    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    /**
     * Creates an audit log entry. This is intended for internal use by other services.
     * @param createAuditLogDto - Data for creating the audit log.
     * @returns The created audit log entry.
     */
    async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
        const user = await this.userRepository.findOneBy({
            id: createAuditLogDto.userId,
        });
        if (!user) {
            this.logger.error(
                `User with ID ${createAuditLogDto.userId} not found for audit logging.`,
            );
            throw new NotFoundException(
                `User with ID ${createAuditLogDto.userId} not found.`,
            );
        }

        const auditLog = this.auditLogRepository.create({
            ...createAuditLogDto,
            user,
        });

        return this.auditLogRepository.save(auditLog);
    }

    /**
     * Finds all audit logs with pagination and filtering.
     * @param queryDto - DTO for pagination, filtering, and sorting.
     * @returns A paginated list of audit logs.
     */
    async findAll(queryDto: QueryAuditLogDto): Promise<Paginated<AuditLog>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = SortOrder.DESC,
            ...filters
        } = queryDto;

        const where: any = {};
        if (filters.userId) where.user = { id: filters.userId };
        if (filters.action) where.action = filters.action;
        if (filters.entityType) where.entityType = filters.entityType;
        if (filters.startDate && filters.endDate) {
            where.createdAt = Between(
                new Date(filters.startDate),
                new Date(filters.endDate),
            );
        } else if (filters.startDate) {
            where.createdAt = MoreThanOrEqual(new Date(filters.startDate));
        } else if (filters.endDate) {
            where.createdAt = LessThanOrEqual(new Date(filters.endDate));
        }

        const [data, totalItems] = await this.auditLogRepository.findAndCount({
            where,
            relations: {
                user: true,
            },
            order: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
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

    /**
     * Finds a single audit log by its ID.
     * @param id - The UUID of the audit log.
     * @returns The found audit log entry.
     */
    async findOne(id: string): Promise<AuditLog> {
        const auditLog = await this.auditLogRepository.findOne({
            where: { id },
            relations: {
                user: true,
            },
        });
        if (!auditLog) {
            throw new NotFoundException(`AuditLog with ID ${id} not found.`);
        }
        return auditLog;
    }

    /**
     * Updates an audit log entry.
     * Note: This is generally not a recommended practice for audit logs.
     * @param id - The ID of the audit log to update.
     * @param updateAuditLogDto - The data to update.
     * @returns The updated audit log entry.
     */
    async update(
        id: string,
        updateAuditLogDto: UpdateAuditLogDto,
    ): Promise<AuditLog> {
        const auditLog = await this.findOne(id);

        // Use merge as requested to update the entity
        this.auditLogRepository.merge(auditLog, updateAuditLogDto);

        return this.auditLogRepository.save(auditLog);
    }

    /**
     * Removes an audit log entry.
     * @param id - The ID of the audit log to remove.
     */
    async remove(id: string): Promise<void> {
        const result = await this.auditLogRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`AuditLog with ID ${id} not found.`);
        }
    }
}
