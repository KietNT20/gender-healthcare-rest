import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
    ) {}

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        //kiểm tra nếu có bị trùng name 
        const existingCategoryByName = await this.categoryRepository.findOne({
            where: { name: createCategoryDto.name },
        });
        if (existingCategoryByName) {
            throw new ConflictException(`Category with name '${createCategoryDto.name}' already exists`);
        }

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

    async findAll(): Promise<Category[]> {
        return this.categoryRepository.find({
            where: { isActive: true },
            relations: {
                children: true,
                parent: true,
            },
        });
    }

    async findOne(id: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id, isActive: true },
            relations: {
                children: true,
                parent: true,
            },
        });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async update(
        id: string,
        updateCategoryDto: UpdateCategoryDto,
    ): Promise<Category> {
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

        const updatedCategory = this.categoryRepository.merge(
            category,
            updateCategoryDto,
        );

        return this.categoryRepository.save(updatedCategory);
    }

    async remove(id: string): Promise<void> {
        const result = await this.categoryRepository.softDelete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
    }
}
