import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { Repository } from 'typeorm';
import { MenstrualCycle } from '../menstrual-cycles/entities/menstrual-cycle.entity';
import { Mood } from '../moods/entities/mood.entity';
import { CreateCycleMoodDto } from './dto/create-cycle-mood.dto';
import { CycleMoodQueryDto } from './dto/cycle-mood-query.dto';
import { UpdateCycleMoodDto } from './dto/update-cycle-mood.dto';
import { CycleMood } from './entities/cycle-mood.entity';

@Injectable()
export class CycleMoodsService {
    constructor(
        @InjectRepository(Mood)
        private readonly moodRepository: Repository<Mood>,
        @InjectRepository(MenstrualCycle)
        private readonly cycleRepository: Repository<MenstrualCycle>,
        @InjectRepository(CycleMood)
        private readonly cycleMoodRepository: Repository<CycleMood>,
    ) {}
    async create(createCycleMoodDto: CreateCycleMoodDto): Promise<CycleMood> {
        const cycleMood = this.cycleMoodRepository.create(createCycleMoodDto);
        return this.cycleMoodRepository.save(cycleMood);
    }

    async findAll(
        cycleMoodQueryDto: CycleMoodQueryDto,
    ): Promise<Paginated<CycleMood>> {
        const { page, limit, cycleId, moodId, intensity, sortBy, sortOrder } =
            cycleMoodQueryDto;

        let pageNumber = page || 1;
        let limitNumber = limit || 10;

        const queryBuilder = this.cycleMoodRepository
            .createQueryBuilder('cycleMood')
            .where('cycleMood.deletedAt IS NULL')
            .leftJoinAndSelect('cycleMood.mood', 'mood')
            .leftJoinAndSelect('cycleMood.cycle', 'cycle');

        if (cycleId) {
            queryBuilder.andWhere('cycleMood.cycleId = :cycleId', {
                cycleId,
            });

            const cycle = await this.cycleRepository.findOneBy({ id: cycleId });

            if (!cycle) {
                throw new NotFoundException(
                    `Không tìm thấy Chu kỳ kinh nguyệt có ID là ${cycleId}`,
                );
            }
        }

        if (moodId) {
            queryBuilder.andWhere('cycleMood.moodId = :moodId', {
                moodId,
            });

            const mood = await this.moodRepository.findOneBy({ id: moodId });

            if (!mood) {
                throw new NotFoundException(
                    `Không tìm thấy Tâm trạng có ID là ${moodId}`,
                );
            }
        }

        if (intensity) {
            queryBuilder.andWhere('cycleMood.intensity = :intensity', {
                intensity,
            });
        }

        if (sortBy) {
            queryBuilder.orderBy(`cycleMood.${sortBy}`, sortOrder || 'DESC');
        } else {
            queryBuilder.orderBy('cycleMood.createdAt', sortOrder || 'DESC');
        }

        queryBuilder.skip((pageNumber - 1) * limitNumber).take(limitNumber);

        const [items, total] = await queryBuilder.getManyAndCount();

        return {
            data: items,
            meta: {
                totalItems: total,
                itemsPerPage: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
                currentPage: pageNumber,
            },
        };
    }

    async findOne(id: string): Promise<CycleMood> {
        const cycleMood = await this.cycleMoodRepository.findOne({
            where: { id },
            relations: {
                mood: true,
                cycle: true,
            },
        });

        if (!cycleMood) {
            throw new NotFoundException(
                `Không tìm thấy Tâm trạng chu kỳ với ID là ${id}`,
            );
        }

        return cycleMood;
    }

    async update(
        id: string,
        updateCycleMoodDto: UpdateCycleMoodDto,
    ): Promise<CycleMood> {
        const checkCycleMood = await this.cycleMoodRepository.findOneBy({ id });

        if (!checkCycleMood) {
            throw new NotFoundException(
                `Không tìm thấy Tâm trạng chu kỳ với ID là ${id}`,
            );
        }

        const updatedCycleMood = this.cycleMoodRepository.merge(
            checkCycleMood,
            updateCycleMoodDto,
        );

        return this.cycleMoodRepository.save(updatedCycleMood);
    }

    async remove(id: string): Promise<void> {
        const deletedCycleMood = await this.cycleMoodRepository.softDelete(id);
        if (deletedCycleMood.affected === 0) {
            throw new NotFoundException(
                `Không tìm thấy Tâm trạng chu kỳ với ID là ${id}`,
            );
        }
    }
}
