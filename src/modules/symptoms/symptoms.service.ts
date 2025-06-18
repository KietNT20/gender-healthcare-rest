import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { SymptomQueryDto } from './dto/symptom-query.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { Symptom } from './entities/symptom.entity';

@Injectable()
export class SymptomsService {
    constructor(
        @InjectRepository(Symptom)
        private readonly symptomRepository: Repository<Symptom>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
    ) {}

    async create(createSymptomDto: CreateSymptomDto): Promise<Symptom> {
        if (createSymptomDto.categoryId) {
            const category = await this.categoryRepository.findOneBy({
                id: createSymptomDto.categoryId,
            });

            if (!category) {
                throw new NotFoundException(
                    `Category with ID ${createSymptomDto.categoryId} not found`,
                );
            }
        }

        const symptom = this.symptomRepository.create(createSymptomDto);

        return this.symptomRepository.save(symptom);
    }

    async findAll(
        symptomQueryDto: SymptomQueryDto,
    ): Promise<Paginated<Symptom>> {
        const { name, sortBy, sortOrder, page, limit } = symptomQueryDto;
        const query = this.symptomRepository.createQueryBuilder('symptom');

        let pageNumber = page || 1;
        let limitNumber = limit || 10;

        if (name) {
            query.andWhere('symptom.name ILIKE :name', { name: `%${name}%` });
        }

        if (sortBy) {
            query.orderBy(`symptom.${sortBy}`, sortOrder);
        }

        const skip = (pageNumber - 1) * limitNumber;
        query.skip(skip).take(limitNumber);

        const [result, totalItems] = await query.getManyAndCount();

        if (result.length === 0 && totalItems === 0) {
            throw new NotFoundException('Không tìm thấy triệu chứng nào');
        }

        const totalPages = Math.ceil(totalItems / limitNumber);

        return {
            data: result,
            meta: {
                itemsPerPage: limitNumber,
                totalItems,
                currentPage: pageNumber,
                totalPages,
            },
        };
    }

    async findOne(id: string): Promise<Symptom | null> {
        const data = await this.symptomRepository.findOneBy({ id });

        if (!data) {
            throw new NotFoundException(
                'Không tìm thấy triệu chứng với ID là ' + id,
            );
        }

        return data;
    }

    async update(
        id: string,
        updateSymptomDto: UpdateSymptomDto,
    ): Promise<Symptom> {
        await this.symptomRepository.update(id, {
            ...updateSymptomDto,
            updatedAt: new Date(),
        });

        const updatedSymptom = await this.symptomRepository.findOneBy({ id });

        if (!updatedSymptom) {
            throw new NotFoundException(
                'Không tìm thấy triệu chứng với ID là ' + id,
            );
        }

        return updatedSymptom;
    }

    async remove(id: string) {
        const result = await this.symptomRepository.delete(id);

        if (!result.affected) {
            throw new NotFoundException(
                'Không tìm thấy triệu chứng với ID là ' + id,
            );
        }
    }
}
