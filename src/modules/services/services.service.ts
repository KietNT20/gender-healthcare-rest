import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { LocationTypeEnum, SortOrder } from 'src/enums';
import { Brackets, IsNull, Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';

@Injectable()
export class ServicesService {
    private readonly logger = new Logger(ServicesService.name);

    constructor(
        @InjectRepository(Service)
        private readonly serviceRepo: Repository<Service>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
    ) {}

    /**
     * Create a new service
     * @param createServiceDto Input data to create a service
     * @returns Created service
     */
    async create(createServiceDto: CreateServiceDto): Promise<Service> {
        // Generate slug from name
        const baseSlug = slugify(createServiceDto.name, {
            lower: true,
            strict: true,
        });
        const slug = await this.generateUniqueSlug(baseSlug);

        // Validate categoryId
        let category: Category | null = null;
        if (createServiceDto.categoryId) {
            category = await this.categoryRepo.findOne({
                where: { id: createServiceDto.categoryId, deletedAt: IsNull() },
            });

            if (!category) {
                throw new NotFoundException(
                    `Category with ID '${createServiceDto.categoryId}' not found`,
                );
            }
        }

        // Create service entity
        const newService = this.serviceRepo.create({
            ...createServiceDto,
            category: createServiceDto.categoryId
                ? { id: createServiceDto.categoryId }
                : undefined,
            isActive: createServiceDto.isActive ?? true,
            featured: createServiceDto.featured ?? false,
            requiresConsultant: createServiceDto.requiresConsultant ?? false,
            location: createServiceDto.location ?? LocationTypeEnum.OFFICE,
        });

        // Assign slug separately
        newService.slug = slug;

        return this.serviceRepo.save(newService);
    }

    /**
     * Retrieve a list of services with filtering, sorting, and pagination
     * @param serviceQueryDto Query parameters for filtering, sorting, and pagination
     * @returns Paginated list of services
     */
    async findAll(
        serviceQueryDto: ServiceQueryDto,
    ): Promise<Paginated<Service>> {
        const queryBuilder = this.serviceRepo
            .createQueryBuilder('service')
            .leftJoinAndSelect('service.category', 'category')
            .leftJoinAndSelect('service.images', 'images')
            .where('service.deletedAt IS NULL');

        const {
            search,
            minPrice,
            maxPrice,
            isActive,
            featured,
            requiresConsultant,
            categoryId,
            location,
            sortBy = 'createdAt',
            sortOrder = SortOrder.DESC,
            page = 1,
            limit = 10,
        } = serviceQueryDto;

        if (search) {
            queryBuilder.andWhere(
                '(service.name ILIKE :search OR service.description ILIKE :search)',
                {
                    search: `%${search}%`,
                },
            );
        }

        if (categoryId) {
            queryBuilder.andWhere('service.categoryId = :categoryId', {
                categoryId,
            });
        }
        if (minPrice !== undefined) {
            queryBuilder.andWhere('service.price >= :minPrice', { minPrice });
        }
        if (maxPrice !== undefined) {
            queryBuilder.andWhere('service.price <= :maxPrice', { maxPrice });
        }
        if (isActive !== undefined) {
            queryBuilder.andWhere('service.isActive = :isActive', { isActive });
        }
        if (featured !== undefined) {
            queryBuilder.andWhere('service.featured = :featured', { featured });
        }
        if (requiresConsultant !== undefined) {
            queryBuilder.andWhere(
                'service.requiresConsultant = :requiresConsultant',
                { requiresConsultant },
            );
        }
        if (location !== undefined) {
            queryBuilder.andWhere('service.location = :location', { location });
        }

        const allowedSortFields = [
            'name',
            'price',
            'duration',
            'createdAt',
            'updatedAt',
        ];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';
        queryBuilder.orderBy(`service.${sortField}`, sortOrder);

        // Apply pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        // Execute and format response
        const [services, totalItems] = await queryBuilder.getManyAndCount();

        return {
            data: services,
            meta: {
                itemsPerPage: limit,
                totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
            },
        };
    }

    /**
     * Retrieve a list of STI services
     * @returns List of STI services
     */
    async findAllStiServices(): Promise<Service[]> {
        return await this.serviceRepo
            .createQueryBuilder('service')
            .leftJoinAndSelect('service.category', 'category')
            .leftJoinAndSelect('service.images', 'images')
            .where('service.deletedAt IS NULL')
            .andWhere(
                new Brackets((qb) => {
                    qb.where('LOWER(service.name) LIKE :query', {
                        query: '%sti%',
                    })
                        .orWhere('LOWER(service.description) LIKE :query')
                        .orWhere('LOWER(category.type) = :categoryType', {
                            categoryType: 'sti_test',
                        });
                }),
            )
            .getMany();
    }

    /**
     * Find a service by ID
     * @param id Service ID
     * @returns Found service
     */
    async findOne(id: string): Promise<Service> {
        const service = await this.serviceRepo.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                category: true,
                images: true,
            },
        });

        if (!service) {
            throw new NotFoundException(`Service with ID '${id}' not found`);
        }

        return service;
    }

    /**
     * Update service information
     * @param id Service ID
     * @param updateDto Update data
     * @returns Updated service
     */
    async update(id: string, updateDto: UpdateServiceDto): Promise<Service> {
        // Fetch original entity
        const service = await this.serviceRepo.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['category', 'images'],
        });
        if (!service) {
            throw new NotFoundException(`Service with ID '${id}' not found`);
        }

        // Generate new slug if name changed
        let slug = service.slug;
        if (updateDto.name && updateDto.name !== service.name) {
            const baseSlug = slugify(updateDto.name, {
                lower: true,
                strict: true,
            });
            slug = await this.generateUniqueSlug(baseSlug, id);
        }

        // Validate category if provided
        let categoryRef: Category | null = service.category;
        if (updateDto.categoryId && updateDto.categoryId !== categoryRef?.id) {
            categoryRef = await this.categoryRepo.findOne({
                where: { id: updateDto.categoryId, deletedAt: IsNull() },
            });
            if (!categoryRef) {
                throw new NotFoundException(
                    `Category with ID '${updateDto.categoryId}' not found`,
                );
            }
        }

        // Merge changes
        const updatedService = this.serviceRepo.merge(service, {
            ...updateDto,
            slug,
            category: categoryRef ? { id: categoryRef.id } : undefined,
            requiresConsultant:
                updateDto.requiresConsultant ?? service.requiresConsultant,
            location: updateDto.location ?? service.location,
        });

        // Save and return entity
        const savedService = await this.serviceRepo.save(updatedService);
        return savedService;
    }

    /**
     * Soft delete a service
     * @param id Service ID
     */
    async remove(id: string): Promise<void> {
        const service = await this.serviceRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });

        if (!service) {
            throw new NotFoundException(`Service with ID '${id}' not found`);
        }

        await this.serviceRepo.softRemove(service);
    }

    /**
     * Find a service by slug
     * @param slug Service slug
     * @returns Found service
     */
    async findBySlug(slug: string): Promise<Service> {
        const service = await this.serviceRepo.findOne({
            where: { slug, deletedAt: IsNull() },
            relations: ['category', 'images'],
        });

        if (!service) {
            throw new NotFoundException(
                `Service with slug '${slug}' not found`,
            );
        }

        return service;
    }

    /**
     * Generate a unique slug
     * @param baseSlug Base slug
     * @param excludeId ID to exclude from uniqueness check
     * @returns Unique slug
     */
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

    /**
     * Check if a slug exists
     * @param slug Slug to check
     * @param excludeId ID to exclude from check
     * @returns True if slug exists
     */
    private async isSlugExists(
        slug: string,
        excludeId?: string,
    ): Promise<boolean> {
        const queryBuilder = this.serviceRepo
            .createQueryBuilder('service')
            .where('service.slug = :slug', { slug })
            .andWhere('service.deletedAt IS NULL');

        if (excludeId) {
            queryBuilder.andWhere('service.id != :excludeId', { excludeId });
        }

        const count = await queryBuilder.getCount();
        return count > 0;
    }
}
