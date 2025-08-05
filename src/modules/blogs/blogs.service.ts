import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { ContentStatusType, RolesNameEnum } from 'src/enums';
import { Category } from 'src/modules/categories/entities/category.entity';
import { IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/entities/user.entity';
import { BlogNotificationService } from './blog-notification.service';
import { BlogQueryDto } from './dto/blog-query.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { GetBlogMonthYear } from './dto/get-blog.dto';
import { PublishBlogDto } from './dto/publish-blog.dto';
import { ReviewBlogDto } from './dto/review-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Blog } from './entities/blog.entity';

@Injectable()
export class BlogsService {
    constructor(
        @InjectRepository(Blog)
        private readonly blogRepository: Repository<Blog>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        private readonly tagsService: TagsService,
        private readonly blogNotificationService: BlogNotificationService,
    ) {}
    async create(
        createBlogDto: CreateBlogDto,
        authorId: string,
        userRole?: string,
    ): Promise<Blog> {
        const existingBlog = await this.blogRepository.findOne({
            where: {
                title: createBlogDto.title,
                deletedAt: IsNull(),
            },
        });

        if (existingBlog) {
            throw new ConflictException(
                'Tiêu đề của bài viết này bị trùng với một bài viết khác.',
            );
        }

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

        // Determine status and handle auto-publish for Admin/Manager
        let finalStatus = createBlogDto.status || ContentStatusType.DRAFT;
        let publishedAt: Date | undefined;
        let publishedByUser: User | undefined;

        // Auto-publish logic for Admin/Manager
        if (
            createBlogDto.autoPublish &&
            (userRole === RolesNameEnum.ADMIN ||
                userRole === RolesNameEnum.MANAGER)
        ) {
            finalStatus = ContentStatusType.PUBLISHED;
            publishedAt = new Date();
            publishedByUser = { id: authorId } as User;
        }

        // Create blog with proper type handling
        const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            tags: tagNames,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            relatedServicesIds,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            autoPublish,
            ...blogData
        } = createBlogDto;

        const blog = this.blogRepository.create({
            ...blogData,
            slug,
            tags,
            status: finalStatus,
            publishedAt,
            publishedByUser,
            author: { id: authorId } as User,
        });

        const savedBlog = await this.blogRepository.save(blog);

        // Send notification if auto-published
        if (finalStatus === ContentStatusType.PUBLISHED) {
            await this.blogNotificationService.notifyBlogPublished(savedBlog);
        }
        return savedBlog;
    }

    async findAll(blogQueryDto: BlogQueryDto): Promise<Paginated<Blog>> {
        const queryBuilder = this.blogRepository
            .createQueryBuilder('blog')
            .leftJoinAndSelect('blog.category', 'category')
            .leftJoinAndSelect('blog.tags', 'tag')
            .leftJoinAndSelect('blog.images', 'images')
            .leftJoinAndSelect('blog.author', 'author')
            .leftJoinAndSelect('blog.services', 'services')
            .where('blog.deletedAt IS NULL');

        // Áp dụng bộ lọc theo tags nếu có
        if (blogQueryDto.tags && blogQueryDto.tags.length > 0) {
            queryBuilder.andWhere('tag.name IN (:...tags)', {
                tags: blogQueryDto.tags,
            });
        }

        this.applyBlogFilters(queryBuilder, blogQueryDto);

        // Đặt offset và limit tương tự UsersService
        const offset = (blogQueryDto.page! - 1) * blogQueryDto.limit!;
        queryBuilder.skip(offset).take(blogQueryDto.limit);

        // Xử lý sortBy và sortOrder
        const allowedSortFields = [
            'createdAt',
            'updatedAt',
            'views',
            'title',
            'publishedAt',
        ];
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

    /**
     * Get all blogs pending review
     * @param blogQueryDto
     * @returns Paginated<Blog>
     */
    async findAllPendingReview(
        blogQueryDto: BlogQueryDto,
    ): Promise<Paginated<Blog>> {
        const queryBuilder = this.blogRepository
            .createQueryBuilder('blog')
            .leftJoinAndSelect('blog.category', 'category')
            .leftJoinAndSelect('blog.tags', 'tag')
            .leftJoinAndSelect('blog.images', 'images')
            .leftJoinAndSelect('blog.author', 'author')
            .leftJoinAndSelect('blog.services', 'services')
            .where('blog.deletedAt IS NULL')
            .andWhere('blog.status = :status', {
                status: ContentStatusType.PENDING_REVIEW,
            });

        // Áp dụng bộ lọc theo tags nếu có
        if (blogQueryDto.tags && blogQueryDto.tags.length > 0) {
            queryBuilder.andWhere('tag.name IN (:...tags)', {
                tags: blogQueryDto.tags,
            });
        }

        this.applyBlogFilters(queryBuilder, blogQueryDto);

        // Đặt offset và limit
        const offset = (blogQueryDto.page! - 1) * blogQueryDto.limit!;
        queryBuilder.skip(offset).take(blogQueryDto.limit);

        // Sắp xếp
        const allowedSortFields = [
            'createdAt',
            'updatedAt',
            'views',
            'title',
            'publishedAt',
        ];
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

    /**
     * Get all published blogs
     * @param blogQueryDto
     * @returns Paginated<Blog>
     */
    async findAllPublished(
        blogQueryDto: BlogQueryDto,
    ): Promise<Paginated<Blog>> {
        const queryBuilder = this.blogRepository
            .createQueryBuilder('blog')
            .leftJoinAndSelect('blog.category', 'category')
            .leftJoinAndSelect('blog.tags', 'tag')
            .leftJoinAndSelect('blog.images', 'images')
            .leftJoinAndSelect('blog.author', 'author')
            .leftJoinAndSelect('blog.services', 'services')
            .where('blog.deletedAt IS NULL')
            .andWhere('blog.status = :status', {
                status: ContentStatusType.PUBLISHED,
            });

        // Áp dụng bộ lọc theo tags nếu có
        if (blogQueryDto.tags && blogQueryDto.tags.length > 0) {
            queryBuilder.andWhere('tag.name IN (:...tags)', {
                tags: blogQueryDto.tags,
            });
        }

        this.applyBlogFilters(queryBuilder, blogQueryDto);

        // Đặt offset và limit
        const offset = (blogQueryDto.page! - 1) * blogQueryDto.limit!;
        queryBuilder.skip(offset).take(blogQueryDto.limit);

        // Sắp xếp
        const allowedSortFields = [
            'createdAt',
            'updatedAt',
            'views',
            'title',
            'publishedAt',
        ];
        if (!blogQueryDto.sortBy) {
            blogQueryDto.sortBy = 'publishedAt';
        }
        const sortField = allowedSortFields.includes(blogQueryDto.sortBy)
            ? blogQueryDto.sortBy
            : 'publishedAt';
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

    /**
     * Find blog by id
     * @param id
     * @returns Blog
     */
    async findOne(id: string) {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                category: true,
                author: true,
                tags: true,
                publishedByUser: true,
                services: true,
                images: true,
            },
        });
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }
        return blog;
    }

    /**
     * Find blog by slug
     * @param slug
     * @param incrementView
     * @returns Blog
     */
    async findBySlug(slug: string, incrementView: boolean = true) {
        const blog = await this.blogRepository.findOne({
            where: {
                slug,
                deletedAt: IsNull(),
                status: ContentStatusType.PUBLISHED,
            },
            relations: {
                category: true,
                author: true,
                tags: true,
                images: true,
                services: true,
            },
        });
        if (!blog) {
            throw new NotFoundException(
                `Published blog with slug ${slug} not found`,
            );
        }

        // Increment view count if requested
        if (incrementView) {
            await this.blogRepository.increment({ id: blog.id }, 'views', 1);
            blog.views += 1;
        }

        return blog;
    }

    async update(id: string, updateBlogDto: UpdateBlogDto) {
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

        // Update blog with proper type handling
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tags, relatedServicesIds, ...updateData } = updateBlogDto;
        await this.blogRepository.update(id, {
            ...updateData,
            slug,
            updatedAt: new Date(),
        });

        const updatedBlog = await this.findOne(id);
        return updatedBlog;
    }

    async remove(id: string, deletedByUserId?: string) {
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

    async review(id: string, reviewBlogDto: ReviewBlogDto) {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

        const { status } = reviewBlogDto;
        if (status === ContentStatusType.PUBLISHED) {
            // Nếu trạng thái là PUBLISHED, cần đảm bảo rằng blog đã có slug
            if (!blog.slug) {
                throw new BadRequestException(
                    'Cannot publish blog without a slug',
                );
            }
        }

        await this.blogRepository.update(id, {
            ...reviewBlogDto,
            updatedAt: new Date(),
        });

        return this.findOne(id);
    }

    async increaseViewCount(id: string) {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

        blog.views = (blog.views || 0) + 1;
        await this.blogRepository.save(blog);
    }

    async publish(id: string, publishBlogDto: PublishBlogDto) {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

        // Chỉ cho phép publish nếu blog đang ở trạng thái DRAFT
        if (blog.status !== ContentStatusType.DRAFT) {
            throw new BadRequestException(
                `Blog with ID ${id} is not in draft status`,
            );
        }

        // Cập nhật trạng thái và thông tin publish
        await this.blogRepository.update(id, {
            status: ContentStatusType.PUBLISHED,
            publishedAt: new Date(),
            ...publishBlogDto,
        });

        return this.findOne(id);
    }
    async incrementViewCount(id: string): Promise<Blog> {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                author: true,
            },
        });
        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

        const oldViews = blog.views || 0;
        await this.blogRepository.increment({ id }, 'views', 1);
        const newViews = oldViews + 1;

        // Check for view milestones (100, 500, 1000, 5000, 10000, 50000, 100000)
        const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
        const reachedMilestone = milestones.find(
            (milestone) => oldViews < milestone && newViews >= milestone,
        );

        if (reachedMilestone) {
            const updatedBlog = await this.findOne(id);
            await this.blogNotificationService.notifyBlogViewsMilestone(
                updatedBlog,
                reachedMilestone,
            );
        }

        return this.findOne(id);
    }

    async reviewBlog(
        id: string,
        reviewBlogDto: ReviewBlogDto,
        reviewerId: string,
    ): Promise<Blog> {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                author: true,
            },
        });

        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

        // Validate workflow
        if (blog.status === ContentStatusType.PUBLISHED) {
            throw new BadRequestException('Cannot review a published blog');
        }

        if (blog.status === ContentStatusType.DRAFT) {
            throw new BadRequestException(
                'Blog must be submitted for review first',
            );
        }

        // Validate rejection reason
        if (
            reviewBlogDto.status === ContentStatusType.REJECTED &&
            !reviewBlogDto.rejectionReason
        ) {
            throw new BadRequestException(
                'Rejection reason is required when rejecting a blog',
            );
        }

        // Validate revision notes
        if (
            reviewBlogDto.status === ContentStatusType.NEEDS_REVISION &&
            !reviewBlogDto.revisionNotes
        ) {
            throw new BadRequestException(
                'Revision notes are required when requesting revision',
            );
        }

        const updateData: Partial<Blog> = {
            status: reviewBlogDto.status,
            reviewDate: new Date(),
            reviewedByUser: { id: reviewerId } as any,
            updatedAt: new Date(),
        };

        if (reviewBlogDto.rejectionReason) {
            updateData.rejectionReason = reviewBlogDto.rejectionReason;
        }

        if (reviewBlogDto.revisionNotes) {
            updateData.revisionNotes = reviewBlogDto.revisionNotes;
        }

        await this.blogRepository.update(id, updateData);
        const updatedBlog = await this.findOne(id);

        // Send notifications based on status
        switch (reviewBlogDto.status) {
            case ContentStatusType.APPROVED:
                await this.blogNotificationService.notifyBlogApproved(
                    updatedBlog,
                );
                break;
            case ContentStatusType.REJECTED:
                await this.blogNotificationService.notifyBlogRejected(
                    updatedBlog,
                    reviewBlogDto.rejectionReason,
                );
                break;
            case ContentStatusType.NEEDS_REVISION:
                await this.blogNotificationService.notifyBlogNeedsRevision(
                    updatedBlog,
                    reviewBlogDto.revisionNotes,
                );
                break;
        }

        return updatedBlog;
    }
    async publishBlog(
        id: string,
        publishBlogDto: PublishBlogDto,
        publisherId: string,
    ): Promise<Blog> {
        // Tìm blog với ít relations hơn để tránh timeout
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                author: true,
            },
        });

        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

        if (blog.status !== ContentStatusType.APPROVED) {
            throw new BadRequestException(
                'Only approved blogs can be published',
            );
        }

        // Update blog status với timeout
        await this.blogRepository.update(id, {
            status: ContentStatusType.PUBLISHED,
            publishedAt: new Date(),
            publishedByUser: { id: publisherId } as any,
            updatedAt: new Date(),
            ...publishBlogDto,
        });

        // Lấy blog đã update với ít relations hơn và timeout
        const updatedBlog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                author: true,
                category: true,
                tags: true,
            },
        });

        if (!updatedBlog) {
            throw new NotFoundException(
                `Blog with ID ${id} not found after update`,
            );
        }

        // Gửi notification bất đồng bộ để tránh timeout
        this.blogNotificationService
            .notifyBlogPublished(updatedBlog)
            .catch((error) => {
                console.error(
                    'Failed to send blog published notification:',
                    error,
                );
                // Log thêm thông tin để debug
                console.error('Blog ID:', id, 'Publisher ID:', publisherId);
            });

        return updatedBlog;
    }

    async submitForReview(id: string, currentUser: User): Promise<Blog> {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                author: true,
            },
        });

        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

        // Authorization check: Only the blog author or Admin/Manager can submit for review
        const isAuthor = blog.author.id === currentUser.id;
        const isAdminOrManager =
            currentUser.role?.name === RolesNameEnum.ADMIN ||
            currentUser.role?.name === RolesNameEnum.MANAGER;

        if (!isAuthor && !isAdminOrManager) {
            throw new BadRequestException(
                'Only the blog author or Admin/Manager can submit blogs for review',
            );
        }

        if (blog.status !== ContentStatusType.DRAFT) {
            throw new BadRequestException(
                'Only draft blogs can be submitted for review',
            );
        }

        await this.blogRepository.update(id, {
            status: ContentStatusType.PENDING_REVIEW,
            updatedAt: new Date(),
        });

        const updatedBlog = await this.findOne(id);

        // Send notification
        await this.blogNotificationService.notifyBlogSubmittedForReview(
            updatedBlog,
        );

        return updatedBlog;
    }

    async archiveBlog(id: string, currentUser: User): Promise<Blog> {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                author: true,
            },
        });

        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

        // Authorization check: Only Admin/Manager can archive blogs
        const isAdminOrManager =
            currentUser.role?.name === RolesNameEnum.ADMIN ||
            currentUser.role?.name === RolesNameEnum.MANAGER;

        if (!isAdminOrManager) {
            throw new BadRequestException(
                'Only Admin/Manager can archive blogs',
            );
        }

        await this.blogRepository.update(id, {
            status: ContentStatusType.ARCHIVED,
            updatedAt: new Date(),
        });

        const updatedBlog = await this.findOne(id);

        // Send notification
        await this.blogNotificationService.notifyBlogArchived(updatedBlog);

        return updatedBlog;
    }

    private async generateUniqueSlug(baseSlug: string, excludeId?: string) {
        let slug = baseSlug;
        let counter = 1;

        while (await this.isSlugExists(slug, excludeId)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    private async isSlugExists(slug: string, excludeId?: string) {
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
        queryBuilder: SelectQueryBuilder<Blog>,
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

    /**
     * Direct publish blog from DRAFT (Admin/Manager only)
     * Allows bypassing the review workflow for high-privilege users
     */
    async directPublishBlog(
        id: string,
        publishBlogDto: PublishBlogDto,
        publisherId: string,
    ): Promise<Blog> {
        const blog = await this.blogRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                author: true,
            },
        });

        if (!blog) {
            throw new NotFoundException(`Blog with ID ${id} not found`);
        }

        // Allow publishing from DRAFT status for Admin/Manager
        if (blog.status !== ContentStatusType.DRAFT) {
            throw new BadRequestException(
                'Only draft blogs can be published directly',
            );
        }

        await this.blogRepository.update(id, {
            status: ContentStatusType.PUBLISHED,
            publishedAt: new Date(),
            publishedByUser: { id: publisherId },
            updatedAt: new Date(),
            ...publishBlogDto,
        });

        const updatedBlog = await this.findOne(id);

        // Send notification
        await this.blogNotificationService.notifyBlogPublished(updatedBlog);

        return updatedBlog;
    }

    async getMonthlyBlogStats(getBlogMonthYear: GetBlogMonthYear) {
        const { year, month } = getBlogMonthYear;
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${currentYear + 1}-01-01`);

        const queryBuilder = this.blogRepository
            .createQueryBuilder('blog')
            .select([
                'EXTRACT(MONTH FROM blog.createdAt) as month',
                'COUNT(CASE WHEN blog.status = :createdStatus THEN 1 END) as createdCount',
                'COUNT(CASE WHEN blog.status = :pendingStatus THEN 1 END) as pendingCount',
                'COUNT(CASE WHEN blog.status = :approvedStatus AND blog.updatedAt >= :startDate THEN 1 END) as approvedCount',
            ])
            .where('blog.deletedAt IS NULL')
            .andWhere('blog.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .setParameters({
                createdStatus: ContentStatusType.DRAFT,
                pendingStatus: ContentStatusType.PENDING_REVIEW,
                approvedStatus: ContentStatusType.APPROVED,
                startDate,
            })
            .groupBy('EXTRACT(MONTH FROM blog.createdAt)')
            .orderBy('month', 'ASC');

        const monthlyStats = await queryBuilder.getRawMany();

        const result = Array(12)
            .fill(0)
            .map((_, index) => {
                const monthNum = index + 1;
                const stat = monthlyStats.find(
                    (s) => Number(s.month) === monthNum,
                );
                // If month is specified, only return stats for that month
                if (month && monthNum !== month) return null;
                return {
                    month: monthNum,
                    createdCount: stat ? parseInt(stat.createdcount || '0') : 0,
                    pendingCount: stat ? parseInt(stat.pendingcount || '0') : 0,
                    approvedCount: stat
                        ? parseInt(stat.approvedcount || '0')
                        : 0,
                };
            })
            .filter((r) => r !== null);

        return {
            year: currentYear,
            stats: result,
        };
    }
}
