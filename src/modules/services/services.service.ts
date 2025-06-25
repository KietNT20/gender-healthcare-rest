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

    async create(createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
        const baseSlug = slugify(createServiceDto.name, {
            lower: true,
            strict: true,
        });
        const slug = await this.generateUniqueSlug(baseSlug);

        let category: Category | null = null;
        if (createServiceDto.categoryId) {
            category = await this.categoryRepo.findOne({
                where: { id: createServiceDto.categoryId, deletedAt: IsNull() },
            });
            if (!category) {
                throw new NotFoundException(`Category with ID '${createServiceDto.categoryId}' not found`);
            }
        }

        const newService = this.serviceRepo.create({
            ...createServiceDto,
            slug,
            category: createServiceDto.categoryId ? { id: createServiceDto.categoryId } : undefined,
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

    async findAll(serviceQueryDto: ServiceQueryDto): Promise<Paginated<ServiceResponseDto>> {
        const queryBuilder = this.serviceRepo
            .createQueryBuilder('service')
            .leftJoinAndSelect('service.category', 'category')
            .leftJoinAndSelect('service.images', 'images')
            .where('service.deletedAt IS NULL');

        this.applyServiceFilters(queryBuilder, serviceQueryDto);

        const offset = (serviceQueryDto.page - 1) * serviceQueryDto.limit;
        queryBuilder.skip(offset).take(serviceQueryDto.limit);

        const allowedSortFields = ['name', 'price', 'duration', 'createdAt', 'updatedAt'];
        const sortField = allowedSortFields.includes(serviceQueryDto.sortBy) ? serviceQueryDto.sortBy : 'createdAt';
        queryBuilder.orderBy(`service.${sortField}`, serviceQueryDto.sortOrder);

        this.logger.debug(`Generated SQL Query: ${queryBuilder.getSql()}`);

        const [services, totalItems] = await queryBuilder.getManyAndCount();

        const mappedServices = services.map((service) =>
            plainToClass(ServiceResponseDto, {
                ...service,
                category: service.category,
                images: service.images || [],
            }),
        );

        this.logger.debug(
            `Found ${mappedServices.length} services: ${JSON.stringify(
                mappedServices.map((s) => ({
                    id: s.id,
                    name: s.name,
                    requiresConsultant: s.requiresConsultant,
                })),
            )}`,
        );

        return {
            data: mappedServices,
            meta: {
                itemsPerPage: serviceQueryDto.limit,
                totalItems,
                currentPage: serviceQueryDto.page,
                totalPages: Math.ceil(totalItems / serviceQueryDto.limit),
            },
        };
    }

    private applyServiceFilters(queryBuilder: any, serviceQueryDto: ServiceQueryDto): void {
        const { search, categoryId, minPrice, maxPrice, isActive, featured, requiresConsultant } = serviceQueryDto;

        this.logger.debug(
            `Applying filters: ${JSON.stringify({
                search,
                categoryId,
                minPrice,
                maxPrice,
                isActive,
                featured,
                requiresConsultant,
                requiresConsultantType: typeof requiresConsultant,
            })}`,
        );

        if (search) {
            queryBuilder.andWhere(
                '(service.name ILIKE :search OR service.description ILIKE :search)',
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
            const isActiveFilter = isActive === 1;
            queryBuilder.andWhere('service.isActive = :isActive', { isActive: isActiveFilter });
        }

        if (featured !== undefined) {
            const featuredFilter = featured === 1;
            queryBuilder.andWhere('service.featured = :featured', { featured: featuredFilter });
        }

        if (requiresConsultant !== undefined) {
            const consultantFilter = requiresConsultant === 1;
            this.logger.debug(`Applying requiresConsultant filter: ${consultantFilter} (type: ${typeof consultantFilter})`);
            queryBuilder.andWhere('service.requiresConsultant = :requiresConsultant', {
                requiresConsultant: consultantFilter,
            });
        }
    }

    async findOne(id: string): Promise<ServiceResponseDto> {
        const service = await this.serviceRepo.findOne({
            where: { id, deletedAt: IsNull() },
            relations: { category: true, images: true },
        });

        if (!service) {
            throw new NotFoundException(`Service with ID '${id}' not found`);
        }

        this.logger.debug(
            `Service ID: ${service.id}, Category: ${JSON.stringify(service.category)}, Images: ${JSON.stringify(service.images)}, RequiresConsultant: ${service.requiresConsultant}`,
        );

        return plainToClass(ServiceResponseDto, {
            ...service,
            category: service.category,
            images: service.images || [],
        });
    }

    async update(id: string, updateDto: UpdateServiceDto): Promise<ServiceResponseDto> {
        const service = await this.serviceRepo.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['category', 'images'],
        });
        if (!service) {
            throw new NotFoundException(`Service with ID '${id}' not found`);
        }

        let slug = service.slug;
        if (updateDto.name && updateDto.name !== service.name) {
            const baseSlug = slugify(updateDto.name, { lower: true, strict: true });
            slug = await this.generateUniqueSlug(baseSlug, id);
        }

        let categoryRef: Category | null = service.category;
        if (updateDto.categoryId && updateDto.categoryId !== categoryRef?.id) {
            categoryRef = await this.categoryRepo.findOne({
                where: { id: updateDto.categoryId, deletedAt: IsNull() },
            });
            if (!categoryRef) {
                throw new NotFoundException(`Category with ID '${updateDto.categoryId}' not found`);
            }
        }

        const updatedService = this.serviceRepo.merge(service, {
            ...updateDto,
            slug,
            category: categoryRef ? { id: categoryRef.id } : undefined,
            requiresConsultant: updateDto.requiresConsultant ?? service.requiresConsultant,
            updatedAt: new Date(),
        });

        const savedService = await this.serviceRepo.save(updatedService);
        this.logger.debug(`Updated Service: ${JSON.stringify(savedService)}`);
        return plainToClass(ServiceResponseDto, {
            ...savedService,
            category: savedService.category || categoryRef,
            images: savedService.images || [],
        });
    }

    async remove(id: string): Promise<void> {
        const service = await this.serviceRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });

        if (!service) {
            throw new NotFoundException(`Service with ID '${id}' not found`);
        }

        await this.serviceRepo.softRemove(service);
    }

    async findBySlug(slug: string): Promise<ServiceResponseDto> {
        const service = await this.serviceRepo.findOne({
            where: { slug, deletedAt: IsNull() },
            relations: ['category', 'images'],
        });

        if (!service) {
            throw new NotFoundException(`Service with slug '${slug}' not found`);
        }

        return plainToClass(ServiceResponseDto, {
            ...service,
            category: service.category,
            images: service.images || [],
        });
    }

    private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
        let slug = baseSlug;
        let counter = 1;

        while (await this.isSlugExists(slug, excludeId)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    private async isSlugExists(slug: string, excludeId?: string): Promise<boolean> {
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