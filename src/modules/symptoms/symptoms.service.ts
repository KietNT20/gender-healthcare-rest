import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { SymptomQueryDto } from './dto/query-symptom.dto';
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
        const category = await this.categoryRepository.findOneBy({
            id: createSymptomDto.categoryId,
        });

        if (!category) {
            throw new NotFoundException(
                `Category with ID ${createSymptomDto.categoryId} not found`,
            );
        }

        const symptom = this.symptomRepository.create({
            ...createSymptomDto,
            category,
        });

        return this.symptomRepository.save(symptom);
    }

    async findAll(
        symptomQueryDto: SymptomQueryDto,
    ): Promise<Paginated<Symptom>> {
        const { name, sortBy, sortOrder, page, limit } = symptomQueryDto;
        const query = this.symptomRepository.createQueryBuilder('symptom');

        const pageNumber = page || 1;
        const limitNumber = limit || 10;

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
                currentPage: pageNumber,
                itemsPerPage: limitNumber,
                totalItems,
                totalPages,
            },
        };
    }

    async findOne(id: string): Promise<Symptom> {
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
        const checkSymptom = await this.symptomRepository.findOneBy({ id });

        if (!checkSymptom) {
            throw new NotFoundException(
                'Không tìm thấy triệu chứng với ID là ' + id,
            );
        }

        const category = await this.categoryRepository.findOneBy({
            id: updateSymptomDto.categoryId,
        });

        if (!category) {
            throw new NotFoundException(
                `Category with ID ${updateSymptomDto.categoryId} not found`,
            );
        }

        updateSymptomDto.categoryId = category.id;

        const updatedSymptom = this.symptomRepository.merge(
            checkSymptom,
            updateSymptomDto,
        );

        return this.symptomRepository.save(updatedSymptom);
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
