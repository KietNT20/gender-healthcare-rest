import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { IsNull, Repository } from 'typeorm';
import { ConsultantProfile } from '../consultant-profiles/entities/consultant-profile.entity';
import { CreateConsultantAvailabilityDto } from './dto/create-consultant-availability.dto';
import { QueryConsultantAvailabilityDto } from './dto/query-consultant-availability.dto';
import { UpdateConsultantAvailabilityDto } from './dto/update-consultant-availability.dto';
import { ConsultantAvailability } from './entities/consultant-availability.entity';

@Injectable()
export class ConsultantAvailabilityCrudService {
    constructor(
        @InjectRepository(ConsultantAvailability)
        private readonly availabilityRepository: Repository<ConsultantAvailability>,
    ) {}

    async create(
        profile: ConsultantProfile,
        createDto: CreateConsultantAvailabilityDto,
    ): Promise<ConsultantAvailability> {
        const newAvailability = this.availabilityRepository.create({
            ...createDto,
            consultantProfile: profile,
        });
        return this.availabilityRepository.save(newAvailability);
    }

    async findAll(
        queryDto: QueryConsultantAvailabilityDto,
    ): Promise<Paginated<ConsultantAvailability>> {
        const {
            page = 1,
            limit = 10,
            consultantId,
            dayOfWeek,
            isAvailable,
            location,
            sortBy,
            sortOrder,
        } = queryDto;

        const consultantAvailability = await this.availabilityRepository.find({
            where: {
                deletedAt: IsNull(),
                ...(consultantId && {
                    consultantProfile: { id: consultantId },
                }),
                ...(dayOfWeek !== undefined && { dayOfWeek }),
                ...(isAvailable !== undefined && {
                    isAvailable:
                        isAvailable === 'true'
                            ? true
                            : isAvailable === 'false'
                              ? false
                              : undefined,
                }),
                ...(location && { location }),
            },
            relations: {
                consultantProfile: {
                    user: {
                        role: true,
                    },
                },
            },
            order: {
                [sortBy || 'createdAt']: sortOrder || 'DESC',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        const totalItems = await this.availabilityRepository.count();

        return {
            data: consultantAvailability,
            meta: {
                itemsPerPage: limit,
                totalItems: totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
            },
        };
    }

    async findOneById(id: string): Promise<ConsultantAvailability> {
        const availability = await this.availabilityRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['consultantProfile'],
        });
        if (!availability) {
            throw new NotFoundException(
                `Không tìm thấy lịch làm việc với ID ${id}.`,
            );
        }
        return availability;
    }

    async update(
        id: string,
        updateDto: UpdateConsultantAvailabilityDto,
    ): Promise<ConsultantAvailability> {
        const availability = await this.findOneById(id);
        const updated = this.availabilityRepository.merge(
            availability,
            updateDto,
        );
        return this.availabilityRepository.save(updated);
    }

    async remove(id: string): Promise<void> {
        const result = await this.availabilityRepository.softDelete(id);
        if (result.affected === 0) {
            throw new NotFoundException(
                `Không tìm thấy lịch làm việc với ID ${id} để xóa.`,
            );
        }
    }
}
