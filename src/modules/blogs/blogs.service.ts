import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import slugify from 'slugify';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { IsNull, Repository } from 'typeorm';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogQueryDto } from './dto/blog-query.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { Blog } from './entities/blog.entity';
import { Category } from 'src/modules/categories/entities/category.entity';

@Injectable()
export class BlogsService {
    constructor(
        @InjectRepository(Blog)
        private readonly blogRepository: Repository<Blog>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
    ) {}

    async create(createBlogDto: CreateBlogDto): Promise<BlogResponseDto> {
        // Validate category if provided
        if (createBlogDto.categoryId) {
            const category = await this.categoryRepository.findOne({
                where: { id: createBlogDto.categoryId },
            });
            if (!category) {
                throw new NotFoundException('Category not found');
            }
        }

        // Generate unique slug
        const baseSlug = slugify(createBlogDto.title, {
            lower: true,
            strict: true,
        });
        const slug = await this.generateUniqueSlug(baseSlug);

        // Create blog
        const blog = this.blogRepository.create({
            ...createBlogDto,
            slug,
        });

        const savedBlog = await this.blogRepository.save(blog);
        return this.toBlogResponse(savedBlog);
    }

    async findAll(
        blogQueryDto: BlogQueryDto,
    ): Promise<Paginated<BlogResponseDto>> {
        const queryBuilder = this.blogRepository
            .createQueryBuilder('blog')
            .leftJoinAndSelect('blog.category', 'category')
            .where('blog.deletedAt IS NULL');

        this.applyBlogFilters(queryBuilder, blogQueryDto);

        const offset = (blogQueryDto.page! - 1) * blogQueryDto.limit!;
        queryBuilder.skip(offset).take(blogQueryDto.limit!);

        const allowedSortFields = ['createdAt', 'updatedAt', 'views', 'title'];
        if (!blogQueryDto.sortBy) {
            blogQueryDto.sortBy = 'createdAt';
        }
        const sortField = allowedSortFields.includes(blogQueryDto.sortBy)
            ? blogQueryDto.sortBy
            : 'createdAt';
        queryBuilder.orderBy(`blog.${sortField}`, blogQueryDto.sortOrder);

        const [blogs, totalItems] = await queryBuilder.getManyAndCount();

        return {
            data: blogs.map((blog) => this.toBlogResponse(blog)),
            meta: {
                itemsPerPage: blogQueryDto.limit!,
                totalItems,
                currentPage: blogQueryDto.page!,
                totalPages: Math.ceil(totalItems / blogQueryDto.limit!),
            },
        };
    }

    async findOne(id: string): Promise<BlogResponseDto> {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['category'],
        });
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }
        return this.toBlogResponse(blog);
    }

    async findBySlug(slug: string): Promise<BlogResponseDto> {
        const blog = await this.blogRepository.findOne({
            where: { slug, deletedAt: IsNull() },
            relations: ['category'],
        });
        if (!blog) {
            throw new NotFoundException(`Blog with slug ${slug} not found`);
        }
        return this.toBlogResponse(blog);
    }

    async update(
        id: string,
        updateBlogDto: UpdateBlogDto,
    ): Promise<BlogResponseDto> {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

        // Validate category if provided
        if (updateBlogDto.categoryId) {
            const category = await this.categoryRepository.findOne({
                where: { id: updateBlogDto.categoryId },
            });
            if (!category) {
                throw new NotFoundException('Category not found');
            }
        }

        // Update slug if title is changed
        let slug = blog.slug;
        if (updateBlogDto.title && updateBlogDto.title !== blog.title) {
            const baseSlug = slugify(updateBlogDto.title, {
                lower: true,
                strict: true,
            });
            slug = await this.generateUniqueSlug(baseSlug, id);
        }

        // Update blog
        await this.blogRepository.update(id, {
            ...updateBlogDto,
            slug,
            updatedAt: new Date(),
        });

        const updatedBlog = await this.findOne(id);
        return updatedBlog;
    }

    async remove(id: string, deletedByUserId?: string): Promise<void> {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }
        await this.blogRepository.update(id, {
            deletedAt: new Date(),
            deletedByUserId,
            updatedAt: new Date(),
        });
    }

    private async generateUniqueSlug(
        baseSlug: string,
        excludeId?: string,
    ): Promise<string> {
        let slug = baseSlug;
        let counter = 1;

        while (await this.isSlugExists(slug, excludeId)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    private async isSlugExists(
        slug: string,
        excludeId?: string,
    ): Promise<boolean> {
        const queryBuilder = this.blogRepository
            .createQueryBuilder('blog')
            .where('blog.slug = :slug', { slug })
            .andWhere('blog.deletedAt IS NULL');

        if (excludeId) {
            queryBuilder.andWhere('blog.id != :excludeId', { excludeId });
        }

        const count = await queryBuilder.getCount();
        return count > 0;
    }

    private applyBlogFilters(
        queryBuilder: any,
        blogQueryDto: BlogQueryDto,
    ): void {
        const { title, status, categoryId, isActive } = blogQueryDto;

        if (title) {
            queryBuilder.andWhere('blog.title ILIKE :title', {
                title: `%${title}%`,
            });
        }

        if (status) {
            queryBuilder.andWhere('blog.status = :status', { status });
        }

        if (categoryId) {
            queryBuilder.andWhere('blog.categoryId = :categoryId', {
                categoryId,
            });
        }

        if (isActive !== undefined) {
            queryBuilder.andWhere('blog.isActive = :isActive', { isActive });
        }
    }

    private toBlogResponse(blog: Blog): BlogResponseDto {
        return plainToClass(BlogResponseDto, blog, {
            excludeExtraneousValues: true,
        });
    }
}
