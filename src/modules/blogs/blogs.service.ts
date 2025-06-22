import {
    ConflictException,
    Injectable,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { IsNull, Repository } from 'typeorm';
import { BlogQueryDto } from './dto/blog-query.dto';
import { Blog } from './entities/blog.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { SortOrder } from 'src/enums';
import { CreateBlogDto } from './dto/create-blog.dto';
import slugify from 'slugify';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';

@Injectable()
export class BlogsService {
    constructor(
        @InjectRepository(Blog)
        private readonly blogRepository: Repository<Blog>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        private readonly tagsService: TagsService,
    ) {}

    async create(createBlogDto: CreateBlogDto){
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

        
       // Handle tags
    let tags: Tag[] = [];
    if (createBlogDto.tags && createBlogDto.tags.length > 0) {
      tags = await Promise.all(
        createBlogDto.tags.map(async (tagName) => {
          let tag = await this.tagsService.findOneByName(tagName);
          if (!tag) {
            tag = await this.tagsService.create({ name: tagName });
          }
          return tag;
        }),
      );
    }

    // Create blog with proper type handling
    const { tags: tagNames, relatedServicesIds, ...blogData } = createBlogDto;
    const blog = this.blogRepository.create({
      ...blogData,
      slug,
      tags,
    });

    return this.blogRepository.save(blog);
  }

  async findAll(blogQueryDto: BlogQueryDto): Promise<Paginated<Blog>> {
    const queryBuilder = this.blogRepository
        .createQueryBuilder('blog')
        .leftJoinAndSelect('blog.category', 'category')
        .leftJoinAndSelect('blog.tags', 'tag')
        .leftJoinAndSelect('blog.images', 'images')
        .where('blog.deletedAt IS NULL');

    // Áp dụng bộ lọc theo tags nếu có
    if (blogQueryDto.tags && blogQueryDto.tags.length > 0) {
        queryBuilder.andWhere('tag.name IN (:...tags)', { tags: blogQueryDto.tags });
    }

    this.applyBlogFilters(queryBuilder, blogQueryDto);

    // Đặt offset và limit tương tự UsersService
    const offset = (blogQueryDto.page! - 1) * blogQueryDto.limit!;
    queryBuilder.skip(offset).take(blogQueryDto.limit!);

    // Xử lý sortBy và sortOrder giống UsersService
    const allowedSortFields = ['createdAt', 'updatedAt', 'views', 'title'];
    if (!blogQueryDto.sortBy) {
        blogQueryDto.sortBy = 'createdAt';
    }
    const sortField = allowedSortFields.includes(blogQueryDto.sortBy)
        ? blogQueryDto.sortBy
        : 'createdAt';
    queryBuilder.orderBy(`blog.${sortField}`, blogQueryDto.sortOrder);

    // Thực thi và định dạng response
    const [blogs, totalItems] = await queryBuilder.getManyAndCount();

    return {
        data: blogs,
        meta: {
            itemsPerPage: blogQueryDto.limit!,
            totalItems,
            currentPage: blogQueryDto.page!,
            totalPages: Math.ceil(totalItems / blogQueryDto.limit!),
        },
    };
}


    

    async findOne(id: string){
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['category'],
        });
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }
        return blog;
    }

    async findBySlug(slug: string){
        const blog = await this.blogRepository.findOne({
            where: { slug, deletedAt: IsNull() },
            relations: ['category'],
        });
        if (!blog) {
            throw new NotFoundException(`Blog with slug ${slug} not found`);
        }
        return blog;
    }

    async update(
        id: string,
        updateBlogDto: UpdateBlogDto,
    ){
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

    //     // Validate category if provided
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

        // Update blog with proper type handling
        const { tags, relatedServicesIds, ...updateData } = updateBlogDto;
        await this.blogRepository.update(id, {
            ...updateData,
            slug,
            updatedAt: new Date(),
        });

        const updatedBlog = await this.findOne(id);
        return updatedBlog;
    }

    async remove(id: string, deletedByUserId?: string){
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
    ){
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
    ){
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
        const { title, status, categoryId } = blogQueryDto;

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

        
    }

    
}