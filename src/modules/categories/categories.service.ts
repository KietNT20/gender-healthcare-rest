import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
    ) {}

    async create(createCategoryDto: CreateCategoryDto) {
        const slug = slugify(createCategoryDto.name, {
            lower: true,
            strict: true,
        });
        const category = this.categoryRepository.create({
            ...createCategoryDto,
            slug: slug,
        });

        // Nếu có parentId, kiểm tra và gán
        if (createCategoryDto.parentId) {
            const parent = await this.categoryRepository.findOne({
                where: { id: createCategoryDto.parentId },
            });
            if (!parent) {
                throw new NotFoundException('Parent category not found');
            }
            category.parent = parent;
        } else {
            // Đảm bảo category gốc không có parent
            category.parent = null;
        }

        return this.categoryRepository.save(category);
    }

    async findAll() {
        return this.categoryRepository.find({
            relations: ['children', 'parent'],
        });
    }

    async findOne(id: string) {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['children', 'parent'],
        });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto) {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        //kiem tra va cap nhat slug neu update name
        if (updateCategoryDto.name) {
            const slug = slugify(updateCategoryDto.name, {
                lower: true,
                strict: true,
            });
            category.slug = slug; //update slug moi
        }

        if (updateCategoryDto.parentId) {
            const parent = await this.categoryRepository.findOne({
                where: { id: updateCategoryDto.parentId },
            });
            if (!parent) {
                throw new NotFoundException('Parent category not found');
            }
            category.parent = parent;
        } else {
            category.parent = null;
        }

        Object.assign(category, updateCategoryDto);
        return this.categoryRepository.save(category);
    }

    async remove(id: string) {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return this.categoryRepository.remove(category);
    }
}
