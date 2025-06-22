import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, IsNull } from 'typeorm';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { ServicePackageQueryDto } from './dto/service-package-query.dto';
import { ServicePackage } from './entities/service-package.entity';

@Injectable()
export class ServicePackagesService {
    constructor(
        @InjectRepository(ServicePackage)
        private packageRepository: Repository<ServicePackage>,
    ) {}

    async create(createDto: CreateServicePackageDto) {
        const servicePackage = this.packageRepository.create(createDto);
        return this.packageRepository.save(servicePackage);
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
            where.isActive = isActive;
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
        return servicePackage;
    }

    async update(id: string, updateDto: UpdateServicePackageDto) {
        const servicePackage = await this.findOne(id);
        this.packageRepository.merge(servicePackage, updateDto);
        return this.packageRepository.save(servicePackage);
    }

    async remove(id: string) {
        const servicePackage = await this.findOne(id);
        await this.packageRepository.softDelete(id);
    }
}
