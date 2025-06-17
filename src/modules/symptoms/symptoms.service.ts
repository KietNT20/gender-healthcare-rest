import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { CreateSymptomDto } from './dto/create-symptom.dto';
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

    findAll() {
        return `This action returns all symptoms`;
    }

    findOne(id: number) {
        return `This action returns a #${id} symptom`;
    }

    update(id: number, updateSymptomDto: UpdateSymptomDto) {
        return `This action updates a #${id} symptom`;
    }

    remove(id: number) {
        return `This action removes a #${id} symptom`;
    }
}
