import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, IsNull } from 'typeorm';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { ServicePackageQueryDto } from './dto/service-package-query.dto';
import { ServicePackage } from './entities/service-package.entity';
import slugify from 'slugify';

@Injectable()
export class ServicePackagesService {
    private readonly logger = new Logger(ServicePackagesService.name);

    constructor(
        @InjectRepository(ServicePackage)
        private packageRepository: Repository<ServicePackage>,
    ) {}

    async create(createDto: CreateServicePackageDto) {
        const slug = slugify(createDto.name, {
            lower: true,
            strict: true,
            locale: 'vi',
        });
        const servicePackage = this.packageRepository.create({
            ...createDto,
            slug,
            isActive: createDto.isActive ?? true,
        });
        const savedPackage = await this.packageRepository.save(servicePackage);
        this.logger.debug(`Created Service Package: ${JSON.stringify(savedPackage)}`);
        return savedPackage;
    }

    async findAll(queryDto: ServicePackageQueryDto) {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            search,
            minPrice,
            maxPrice,
            isActive,
        } = queryDto;

        this.logger.debug(
            `Applying filters: ${JSON.stringify({
                page,
                limit,
                sortBy,
                sortOrder,
                search,
                minPrice,
                maxPrice,
                isActive,
                isActiveType: typeof isActive,
            })}`,
        );

        // Validate sortBy
        const validSortFields = [
            'name',
            'price',
            'durationMonths',
            'createdAt',
            'updatedAt',
        ];
        if (sortBy && !validSortFields.includes(sortBy)) {
            throw new BadRequestException(
                `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}`,
            );
        }

        // Build where conditions
        const where: any = { deletedAt: IsNull() };
        if (search) {
            where.name = Like(`%${search}%`);
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = Between(
                minPrice ?? 0,
                maxPrice ?? Number.MAX_SAFE_INTEGER,
            );
        }
        if (isActive !== undefined) {
            const isActiveFilter = isActive === 1;
            this.logger.debug(`Applying isActive filter: ${isActiveFilter} (type: ${typeof isActiveFilter})`);
            where.isActive = isActiveFilter;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query
        const [data, total] = await this.packageRepository.findAndCount({
            where,
            order: { [sortBy]: sortOrder },
            skip,
            take: limit,
            relations: ['packageServices', 'packageServices.service'],
        });

        this.logger.debug(
            `Found ${data.length} service packages: ${JSON.stringify(
                data.map((pkg) => ({
                    id: pkg.id,
                    name: pkg.name,
                    isActive: pkg.isActive,
                })),
            )}`,
        );

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async findOne(id: string) {
        const servicePackage = await this.packageRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['packageServices', 'packageServices.service'],
        });
        if (!servicePackage) {
            throw new NotFoundException(
                `Service package with ID '${id}' not found`,
            );
        }
        this.logger.debug(`Found Service Package: ${JSON.stringify(servicePackage)}`);
        return servicePackage;
    }

    async update(id: string, updateDto: UpdateServicePackageDto) {
        const servicePackage = await this.findOne(id);
        if (updateDto.name) {
            updateDto.slug = slugify(updateDto.name, {
                lower: true,
                strict: true,
                locale: 'vi',
            });
        }
        this.packageRepository.merge(servicePackage, {
            ...updateDto,
            isActive: updateDto.isActive ?? servicePackage.isActive,
        });
        const updatedPackage = await this.packageRepository.save(servicePackage);
        this.logger.debug(`Updated Service Package: ${JSON.stringify(updatedPackage)}`);
        return updatedPackage;
    }

    async remove(id: string) {
        const servicePackage = await this.findOne(id);
        await this.packageRepository.softDelete(id);
        this.logger.debug(`Soft deleted Service Package with ID: ${id}`);
    }
}