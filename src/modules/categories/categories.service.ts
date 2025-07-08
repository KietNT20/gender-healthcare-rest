import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { TreeRepository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: TreeRepository<Category>,
    ) {}

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        //kiểm tra nếu có bị trùng name
        const existingCategoryByName = await this.categoryRepository.findOne({
            where: { name: createCategoryDto.name },
        });
        if (existingCategoryByName) {
            throw new ConflictException(
                `Category with name '${createCategoryDto.name}' already exists`,
            );
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
                services: true,
                blogs: true,
                symptoms: true,
            },
        });
    }

    async findOne(id: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id, isActive: true },
            relations: {
                children: true,
                parent: true,
                services: true,
                blogs: true,
                symptoms: true,
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
        // Check if category has related data
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: {
                services: true,
                blogs: true,
                symptoms: true,
                children: true,
            },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        // Check if category has children
        if (category.children && category.children.length > 0) {
            throw new ConflictException(
                'Cannot delete category that has subcategories',
            );
        }

        // Check if category has related data
        if (
            category.services?.length > 0 ||
            category.blogs?.length > 0 ||
            category.symptoms?.length > 0
        ) {
            throw new ConflictException(
                'Cannot delete category that has related services, blogs, or symptoms',
            );
        }

        const result = await this.categoryRepository.softDelete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
    }

    async findByType(type: string): Promise<Category[]> {
        return this.categoryRepository.find({
            where: { type, isActive: true },
            relations: {
                children: true,
                parent: true,
                services: true,
                blogs: true,
                symptoms: true,
            },
        });
    }

    async getCategoryServices(id: string) {
        const category = await this.categoryRepository.findOne({
            where: { id, isActive: true },
            relations: {
                services: true,
            },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return {
            category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                type: category.type,
            },
            services: category.services,
        };
    }

    async getCategoryBlogs(id: string) {
        const category = await this.categoryRepository.findOne({
            where: { id, isActive: true },
            relations: {
                blogs: {
                    tags: true,
                },
            },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return {
            category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                type: category.type,
            },
            blogs: category.blogs,
        };
    }

    async getCategorySymptoms(id: string) {
        const category = await this.categoryRepository.findOne({
            where: { id, isActive: true },
            relations: {
                symptoms: true,
            },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return {
            category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                type: category.type,
            },
            symptoms: category.symptoms,
        };
    }

    async getCategoryTree(): Promise<Category[]> {
        return this.categoryRepository.findTrees();
    }

    async findCategoriesWithCounts(): Promise<Category[]> {
        const categories = await this.categoryRepository.find({
            where: { isActive: true },
            relations: {
                services: true,
                blogs: true,
                symptoms: true,
            },
        });

        return categories.map((category) => ({
            ...category,
            counts: {
                services: category.services?.length || 0,
                blogs: category.blogs?.length || 0,
                symptoms: category.symptoms?.length || 0,
            },
        }));
    }
}
