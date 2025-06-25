import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { IsNull, Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { Category } from '../categories/entities/category.entity';
import { ServiceQueryDto } from './dto/service-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';
import { ServiceResponseDto } from './dto/service-response.dto';
import { plainToClass } from 'class-transformer';

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
    async create(
        createServiceDto: CreateServiceDto,
    ): Promise<ServiceResponseDto> {
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

        const newService = this.serviceRepo.create({
            ...createServiceDto,
            slug, // Assign auto-generated slug
            category: createServiceDto.categoryId
                ? { id: createServiceDto.categoryId }
                : undefined,
            isActive: createServiceDto.isActive ?? true,
            featured: createServiceDto.featured ?? false,
            requiresConsultant: createServiceDto.requiresConsultant ?? false,
        });

        const savedService = await this.serviceRepo.save(newService);
        this.logger.debug(`Created Service: ${JSON.stringify(savedService)}`);
        return plainToClass(ServiceResponseDto, {
            ...savedService,
            category: savedService.category || category,
            images: savedService.images || [],
        });
    }

    /**
     * Retrieve a list of services with pagination, filtering, and sorting
     * @param serviceQueryDto Query parameters for pagination, filtering, and sorting
     * @returns List of services with pagination metadata
     */
    async findAll(
        serviceQueryDto: ServiceQueryDto,
    ): Promise<Paginated<ServiceResponseDto>> {
        const queryBuilder = this.serviceRepo
            .createQueryBuilder('service')
            .leftJoinAndSelect('service.category', 'category')
            .leftJoinAndSelect('service.images', 'images')
            .where('service.deletedAt IS NULL');

        this.applyServiceFilters(queryBuilder, serviceQueryDto);

        const offset = (serviceQueryDto.page! - 1) * serviceQueryDto.limit!;
        queryBuilder.skip(offset).take(serviceQueryDto.limit!);

        const allowedSortFields = [
            'name',
            'price',
            'duration',
            'createdAt',
            'updatedAt',
        ];
        if (!serviceQueryDto.sortBy) {
            serviceQueryDto.sortBy = 'createdAt';
        }
        const sortField = allowedSortFields.includes(serviceQueryDto.sortBy)
            ? serviceQueryDto.sortBy
            : 'createdAt';
        queryBuilder.orderBy(`service.${sortField}`, serviceQueryDto.sortOrder);

        const [services, totalItems] = await queryBuilder.getManyAndCount();

        // Map to ServiceResponseDto
        const mappedServices = services.map((service) =>
            plainToClass(ServiceResponseDto, {
                ...service,
                category: service.category,
                images: service.images || [],
            }),
        );

        // Debug category and requiresConsultant
        mappedServices.forEach((service) => {
            this.logger.debug(
                `Service ID: ${service.id}, Category: ${JSON.stringify(service.category)}, Images: ${JSON.stringify(service.images)}, RequiresConsultant: ${service.requiresConsultant}`,
            );
        });

        return {
            data: mappedServices,
            meta: {
                itemsPerPage: serviceQueryDto.limit!,
                totalItems,
                currentPage: serviceQueryDto.page!,
                totalPages: Math.ceil(totalItems / serviceQueryDto.limit!),
            },
        };
    }

    private applyServiceFilters(
        queryBuilder: any,
        serviceQueryDto: ServiceQueryDto,
    ): void {
        const {
            search,
            categoryId,
            minPrice,
            maxPrice,
            isActive,
            featured,
            requiresConsultant,
        } = serviceQueryDto;

        this.logger.debug(
            `Received serviceQueryDto: ${JSON.stringify(serviceQueryDto)}`,
        );
        this.logger.debug(
            `Received requiresConsultant: ${requiresConsultant}, type: ${typeof requiresConsultant}`,
        );

        if (search) {
            queryBuilder.andWhere(
                'service.name ILIKE :search OR service.description ILIKE :search',
                { search: `%${search}%` },
            );
        }
    
        if (categoryId) {
            queryBuilder.andWhere('service.categoryId = :categoryId', { categoryId });
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
    }

    /**
     * Find a service by ID
     * @param id Service ID
     * @returns Found service
     */
    async findOne(id: string): Promise<ServiceResponseDto> {
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

        // Debug category and requiresConsultant
        this.logger.debug(
            `Service ID: ${service.id}, Category: ${JSON.stringify(service.category)}, Images: ${JSON.stringify(service.images)}, RequiresConsultant: ${service.requiresConsultant}`,
        );

        return plainToClass(ServiceResponseDto, {
            ...service,
            category: service.category,
            images: service.images || [],
        });
    }

    /**
     * Update service information
     * @param id Service ID
     * @param updateDto Update data
     * @returns Updated service
     */
    async update(
        id: string,
        updateDto: UpdateServiceDto,
    ): Promise<ServiceResponseDto> {
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
            updatedAt: new Date(),
        });

        // Save and return entity
        const savedService = await this.serviceRepo.save(updatedService);
        this.logger.debug(`Updated Service: ${JSON.stringify(savedService)}`);
        return plainToClass(ServiceResponseDto, {
            ...savedService,
            category: savedService.category || categoryRef,
            images: savedService.images || [],
        });
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
    async findBySlug(slug: string): Promise<ServiceResponseDto> {
        const service = await this.serviceRepo.findOne({
            where: { slug, deletedAt: IsNull() },
            relations: ['category', 'images'],
        });

        if (!service) {
            throw new NotFoundException(
                `Service with slug '${slug}' not found`,
            );
        }

        return plainToClass(ServiceResponseDto, {
            ...service,
            category: service.category,
            images: service.images || [],
        });
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
