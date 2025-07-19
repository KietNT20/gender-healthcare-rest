import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesNameEnum } from 'src/enums';
import { Between, FindOptionsWhere, IsNull, Like, Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbacksService {
    private readonly logger = new Logger(FeedbacksService.name);

    constructor(
        @InjectRepository(Feedback)
        private feedbackRepository: Repository<Feedback>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Service)
        private serviceRepository: Repository<Service>,
        @InjectRepository(Appointment)
        private appointmentRepository: Repository<Appointment>,
    ) {}

    async create(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
        // Validate UUID format
        if (createFeedbackDto.userId && !isUUID(createFeedbackDto.userId)) {
            this.logger.error(
                `Invalid UUID format for userId: ${createFeedbackDto.userId}`,
            );
            throw new BadRequestException(
                `Invalid UUID format for userId: ${createFeedbackDto.userId}`,
            );
        }
        if (
            createFeedbackDto.serviceId &&
            !isUUID(createFeedbackDto.serviceId)
        ) {
            this.logger.error(
                `Invalid UUID format for serviceId: ${createFeedbackDto.serviceId}`,
            );
            throw new BadRequestException(
                `Invalid UUID format for serviceId: ${createFeedbackDto.serviceId}`,
            );
        }
        if (
            createFeedbackDto.appointmentId &&
            !isUUID(createFeedbackDto.appointmentId)
        ) {
            this.logger.error(
                `Invalid UUID format for appointmentId: ${createFeedbackDto.appointmentId}`,
            );
            throw new BadRequestException(
                `Invalid UUID format for appointmentId: ${createFeedbackDto.appointmentId}`,
            );
        }
        if (
            createFeedbackDto.consultantId &&
            !isUUID(createFeedbackDto.consultantId)
        ) {
            this.logger.error(
                `Invalid UUID format for consultantId: ${createFeedbackDto.consultantId}`,
            );
            throw new BadRequestException(
                `Invalid UUID format for consultantId: ${createFeedbackDto.consultantId}`,
            );
        }

        // Validate referenced entities
        if (createFeedbackDto.userId) {
            const user = await this.userRepository.findOne({
                where: { id: createFeedbackDto.userId, deletedAt: IsNull() },
            });
            this.logger.log(
                `Checking userId: ${createFeedbackDto.userId}, Found: ${!!user}`,
            );
            if (!user) {
                throw new NotFoundException(
                    `User with ID '${createFeedbackDto.userId}' not found`,
                );
            }
        }

        if (createFeedbackDto.serviceId) {
            const service = await this.serviceRepository.findOne({
                where: { id: createFeedbackDto.serviceId, deletedAt: IsNull() },
            });
            this.logger.log(
                `Checking serviceId: ${createFeedbackDto.serviceId}, Found: ${!!service}`,
            );
            if (!service) {
                throw new NotFoundException(
                    `Service with ID '${createFeedbackDto.serviceId}' not found`,
                );
            }
        }

        if (createFeedbackDto.appointmentId) {
            const appointment = await this.appointmentRepository.findOne({
                where: {
                    id: createFeedbackDto.appointmentId,
                    deletedAt: IsNull(),
                },
            });
            this.logger.log(
                `Checking appointmentId: ${createFeedbackDto.appointmentId}, Found: ${!!appointment}`,
            );
            if (!appointment) {
                throw new NotFoundException(
                    `Appointment with ID '${createFeedbackDto.appointmentId}' not found`,
                );
            }
        }

        if (createFeedbackDto.consultantId) {
            // Try checking roleId as string first
            let consultant = await this.userRepository.findOne({
                where: {
                    id: createFeedbackDto.consultantId,
                    role: {
                        name: RolesNameEnum.CONSULTANT,
                    },
                    deletedAt: IsNull(),
                },
            });
            this.logger.log(
                `Checking consultantId (string roleId): ${createFeedbackDto.consultantId}, Found: ${!!consultant}`,
            );

            // If not found, try checking with Role relation
            if (!consultant) {
                consultant = await this.userRepository.findOne({
                    where: {
                        id: createFeedbackDto.consultantId,
                        role: { name: RolesNameEnum.CONSULTANT },
                        deletedAt: IsNull(),
                    },
                    relations: ['role'],
                });
                this.logger.log(
                    `Checking consultantId (Role relation): ${createFeedbackDto.consultantId}, Found: ${!!consultant}`,
                );
            }

            if (!consultant) {
                throw new NotFoundException(
                    `Consultant with ID '${createFeedbackDto.consultantId}' not found or does not have CONSULTANT role`,
                );
            }
        }

        const feedback = this.feedbackRepository.create(createFeedbackDto);
        return this.feedbackRepository.save(feedback);
    }

    async findAll(queryDto: FeedbackQueryDto) {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            userId,
            serviceId,
            appointmentId,
            consultantId,
            minRating,
            maxRating,
            isAnonymous,
            searchComment,
        } = queryDto;

        // Validate sortBy
        const validSortFields = ['rating', 'createdAt', 'updatedAt'];
        if (sortBy && !validSortFields.includes(sortBy)) {
            throw new BadRequestException(
                `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}`,
            );
        }

        // Validate UUID format for query parameters
        if (userId && !isUUID(userId)) {
            throw new BadRequestException(
                `Invalid UUID format for userId: ${userId}`,
            );
        }
        if (serviceId && !isUUID(serviceId)) {
            throw new BadRequestException(
                `Invalid UUID format for serviceId: ${serviceId}`,
            );
        }
        if (appointmentId && !isUUID(appointmentId)) {
            throw new BadRequestException(
                `Invalid UUID format for appointmentId: ${appointmentId}`,
            );
        }
        if (consultantId && !isUUID(consultantId)) {
            throw new BadRequestException(
                `Invalid UUID format for consultantId: ${consultantId}`,
            );
        }

        // Build where conditions
        const where: FindOptionsWhere<Feedback> = { deletedAt: IsNull() };
        if (userId) {
            where.user = { id: userId };
        }
        if (serviceId) {
            where.service = { id: serviceId };
        }
        if (appointmentId) {
            where.appointment = { id: appointmentId };
        }
        if (consultantId) {
            where.consultant = { id: consultantId };
        }
        if (minRating !== undefined || maxRating !== undefined) {
            where.rating = Between(minRating ?? 1, maxRating ?? 5);
        }
        if (isAnonymous !== undefined) {
            where.isAnonymous = isAnonymous === 'true' ? true : false;
        }
        if (searchComment) {
            where.comment = Like(`%${searchComment}%`);
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query
        const [data, total] = await this.feedbackRepository.findAndCount({
            where,
            order: { [sortBy]: sortOrder },
            skip,
            take: limit,
            relations: ['user', 'service', 'appointment'],
        });

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async findOne(id: string): Promise<Feedback> {
        if (!isUUID(id)) {
            throw new BadRequestException(
                `Invalid UUID format for feedback ID: ${id}`,
            );
        }

        const feedback = await this.feedbackRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['user', 'service', 'appointment'],
        });
        if (!feedback) {
            throw new NotFoundException(`Feedback with ID '${id}' not found`);
        }
        return feedback;
    }

    async update(
        id: string,
        updateFeedbackDto: UpdateFeedbackDto,
    ): Promise<Feedback> {
        if (!isUUID(id)) {
            throw new BadRequestException(
                `Invalid UUID format for feedback ID: ${id}`,
            );
        }

        const feedback = await this.findOne(id);

        // Validate UUID format
        if (updateFeedbackDto.userId && !isUUID(updateFeedbackDto.userId)) {
            this.logger.error(
                `Invalid UUID format for userId: ${updateFeedbackDto.userId}`,
            );
            throw new BadRequestException(
                `Invalid UUID format for userId: ${updateFeedbackDto.userId}`,
            );
        }
        if (
            updateFeedbackDto.serviceId &&
            !isUUID(updateFeedbackDto.serviceId)
        ) {
            this.logger.error(
                `Invalid UUID format for serviceId: ${updateFeedbackDto.serviceId}`,
            );
            throw new BadRequestException(
                `Invalid UUID format for serviceId: ${updateFeedbackDto.serviceId}`,
            );
        }
        if (
            updateFeedbackDto.appointmentId &&
            !isUUID(updateFeedbackDto.appointmentId)
        ) {
            this.logger.error(
                `Invalid UUID format for appointmentId: ${updateFeedbackDto.appointmentId}`,
            );
            throw new BadRequestException(
                `Invalid UUID format for appointmentId: ${updateFeedbackDto.appointmentId}`,
            );
        }
        if (
            updateFeedbackDto.consultantId &&
            !isUUID(updateFeedbackDto.consultantId)
        ) {
            this.logger.error(
                `Invalid UUID format for consultantId: ${updateFeedbackDto.consultantId}`,
            );
            throw new BadRequestException(
                `Invalid UUID format for consultantId: ${updateFeedbackDto.consultantId}`,
            );
        }

        // Validate referenced entities
        if (updateFeedbackDto.userId) {
            const user = await this.userRepository.findOne({
                where: { id: updateFeedbackDto.userId, deletedAt: IsNull() },
            });
            this.logger.log(
                `Checking userId: ${updateFeedbackDto.userId}, Found: ${!!user}`,
            );
            if (!user) {
                throw new NotFoundException(
                    `User with ID '${updateFeedbackDto.userId}' not found`,
                );
            }
        }

        if (updateFeedbackDto.serviceId) {
            const service = await this.serviceRepository.findOne({
                where: { id: updateFeedbackDto.serviceId, deletedAt: IsNull() },
            });
            this.logger.log(
                `Checking serviceId: ${updateFeedbackDto.serviceId}, Found: ${!!service}`,
            );
            if (!service) {
                throw new NotFoundException(
                    `Service with ID '${updateFeedbackDto.serviceId}' not found`,
                );
            }
        }

        if (updateFeedbackDto.appointmentId) {
            const appointment = await this.appointmentRepository.findOne({
                where: {
                    id: updateFeedbackDto.appointmentId,
                    deletedAt: IsNull(),
                },
            });
            this.logger.log(
                `Checking appointmentId: ${updateFeedbackDto.appointmentId}, Found: ${!!appointment}`,
            );
            if (!appointment) {
                throw new NotFoundException(
                    `Appointment with ID '${updateFeedbackDto.appointmentId}' not found`,
                );
            }
        }

        if (updateFeedbackDto.consultantId) {
            let consultant = await this.userRepository.findOne({
                where: {
                    id: updateFeedbackDto.consultantId,
                    role: { name: RolesNameEnum.CONSULTANT },
                    deletedAt: IsNull(),
                },
            });
            this.logger.log(
                `Checking consultantId (string roleId): ${updateFeedbackDto.consultantId}, Found: ${!!consultant}`,
            );

            if (!consultant) {
                consultant = await this.userRepository.findOne({
                    where: {
                        id: updateFeedbackDto.consultantId,
                        role: { name: RolesNameEnum.CONSULTANT },
                        deletedAt: IsNull(),
                    },
                    relations: ['role'],
                });
                this.logger.log(
                    `Checking consultantId (Role relation): ${updateFeedbackDto.consultantId}, Found: ${!!consultant}`,
                );
            }

            if (!consultant) {
                throw new NotFoundException(
                    `Consultant with ID '${updateFeedbackDto.consultantId}' not found or does not have CONSULTANT role`,
                );
            }
        }

        this.feedbackRepository.merge(feedback, updateFeedbackDto);
        return this.feedbackRepository.save(feedback);
    }

    async remove(id: string): Promise<void> {
        const feedback = await this.feedbackRepository.findOneBy({ id });
        if (!feedback) {
            throw new NotFoundException(
                `Feedback with ID: ( ${id} ) not found`,
            );
        }
        await this.feedbackRepository.softDelete(id);
    }
}
