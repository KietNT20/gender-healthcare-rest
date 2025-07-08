import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { Repository } from 'typeorm';
import { MenstrualCycle } from '../menstrual-cycles/entities/menstrual-cycle.entity';
import { Symptom } from '../symptoms/entities/symptom.entity';
import { CreateCycleSymptomDto } from './dto/create-cycle-symptom.dto';
import { CycleSymptomQueryDto } from './dto/cycle-symptom-query.dto';
import { UpdateCycleSymptomDto } from './dto/update-cycle-symptom.dto';
import { CycleSymptom } from './entities/cycle-symptom.entity';

@Injectable()
export class CycleSymptomsService {
    constructor(
        @InjectRepository(Symptom)
        private readonly symptomRepository: Repository<Symptom>,
        @InjectRepository(MenstrualCycle)
        private readonly menstrualCycleRepository: Repository<MenstrualCycle>,
        @InjectRepository(CycleSymptom)
        private readonly cycleSymptomRepository: Repository<CycleSymptom>,
    ) {}
    async create(
        createCycleSymptomDto: CreateCycleSymptomDto,
    ): Promise<CycleSymptom> {
        const cycleSymptom = this.cycleSymptomRepository.create(
            createCycleSymptomDto,
        );
        return this.cycleSymptomRepository.save(cycleSymptom);
    }

    async findAll(
        cycleSymptomQueryDto: CycleSymptomQueryDto,
    ): Promise<Paginated<CycleSymptom>> {
        const {
            page,
            limit,
            menstrualCycleId,
            symptomId,
            intensity,
            sortBy,
            sortOrder,
        } = cycleSymptomQueryDto;

        const pageNumber = page || 1;
        const limitNumber = limit || 10;

        const queryBuilder = this.cycleSymptomRepository
            .createQueryBuilder('cycleSymptom')
            .where('cycleSymptom.deletedAt IS NULL')
            .leftJoinAndSelect('cycleSymptom.symptom', 'symptom')
            .leftJoinAndSelect('cycleSymptom.cycle', 'cycle');

        if (menstrualCycleId) {
            queryBuilder.andWhere(
                'cycleSymptom.menstrualCycleId = :menstrualCycleId',
                {
                    menstrualCycleId,
                },
            );

            const menstrualCycle =
                await this.menstrualCycleRepository.findOneBy({
                    id: menstrualCycleId,
                });

            if (!menstrualCycle) {
                throw new NotFoundException(
                    `Không tìm thấy Chu kỳ kinh nguyệt có ID là ${menstrualCycleId}`,
                );
            }
        }

        if (symptomId) {
            queryBuilder.andWhere('cycleSymptom.symptomId = :symptomId', {
                symptomId,
            });

            const symptom = await this.symptomRepository.findOneBy({
                id: symptomId,
            });

            if (!symptom) {
                throw new NotFoundException(
                    `Không tìm thấy Triệu chứng có ID là ${symptomId}`,
                );
            }
        }

        if (intensity) {
            queryBuilder.andWhere('cycleSymptom.intensity = :intensity', {
                intensity,
            });
        }

        if (sortBy) {
            queryBuilder.orderBy(`cycleSymptom.${sortBy}`, sortOrder || 'DESC');
        } else {
            queryBuilder.orderBy('cycleSymptom.createdAt', sortOrder || 'DESC');
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

    async findOne(id: string): Promise<CycleSymptom> {
        const cycleSymptom = await this.cycleSymptomRepository.findOne({
            where: { id },
            relations: {
                symptom: true,
                menstrualCycle: true,
            },
        });

        if (!cycleSymptom) {
            throw new NotFoundException(
                `Không tìm thấy Triệu chứng chu kỳ với ID là ${id}`,
            );
        }

        return cycleSymptom;
    }

    async update(
        id: string,
        updateCycleSymptomDto: UpdateCycleSymptomDto,
    ): Promise<CycleSymptom> {
        const checkCycleSymptom = await this.cycleSymptomRepository.findOneBy({
            id,
        });

        if (!checkCycleSymptom) {
            throw new NotFoundException(
                `Không tìm thấy Triệu chứng chu kỳ với ID là ${id}`,
            );
        }

        const updatedCycleSymptom = this.cycleSymptomRepository.merge(
            checkCycleSymptom,
            updateCycleSymptomDto,
        );

        return this.cycleSymptomRepository.save(updatedCycleSymptom);
    }

    async remove(id: string): Promise<void> {
        const deletedCycleSymptom =
            await this.cycleSymptomRepository.softDelete(id);
        if (deletedCycleSymptom.affected === 0) {
            throw new NotFoundException(
                `Không tìm thấy Triệu chứng chu kỳ với ID là ${id}`,
            );
        }
    }
}
