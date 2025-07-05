import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { SortOrder } from 'src/enums';
import { Between, FindOptionsWhere, IsNull, Like, Repository } from 'typeorm';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { ServicePackageQueryDto } from './dto/service-package-query.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { ServicePackage } from './entities/service-package.entity';

@Injectable()
export class ServicePackagesService {
    constructor(
        @InjectRepository(ServicePackage)
        private packageRepository: Repository<ServicePackage>,
    ) {}

    async create(createDto: CreateServicePackageDto) {
        // Tạo slug từ tên gói dịch vụ bằng slugify
        const slug = slugify(createDto.name, {
            lower: true, // Chuyển thành chữ thường
            strict: true, // Loại bỏ ký tự đặc biệt
            locale: 'vi', // Hỗ trợ xử lý dấu tiếng Việt
        });
        const servicePackage = this.packageRepository.create({
            ...createDto,
            slug,
        });
        return this.packageRepository.save(servicePackage);
    }

    async findAll(
        queryDto: ServicePackageQueryDto,
    ): Promise<Paginated<ServicePackage>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = SortOrder.DESC,
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
        const where: FindOptionsWhere<ServicePackage> = { deletedAt: IsNull() };
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
            where.isActive = isActive === 'true' ? true : false;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query
        const [data, total] = await this.packageRepository.findAndCount({
            where,
            order: { [sortBy]: sortOrder },
            skip,
            take: limit,
            relations: {
                packageServices: {
                    service: true,
                },
            },
        });

        return {
            data,
            meta: {
                itemsPerPage: limit,
                totalItems: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<ServicePackage> {
        const servicePackage = await this.packageRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: {
                packageServices: {
                    service: true,
                },
            },
        });
        if (!servicePackage) {
            throw new NotFoundException(
                `Service package with ID '${id}' not found`,
            );
        }
        return servicePackage;
    }

    async update(
        id: string,
        updateDto: UpdateServicePackageDto,
    ): Promise<ServicePackage> {
        const servicePackage = await this.findOne(id);
        // Nếu có cập nhật tên, tạo slug mới
        if (updateDto.name) {
            updateDto.slug = slugify(updateDto.name, {
                lower: true,
                strict: true,
                locale: 'vi',
            });
        }
        this.packageRepository.merge(servicePackage, updateDto);
        return this.packageRepository.save(servicePackage);
    }

    async remove(id: string): Promise<void> {
        const result = await this.packageRepository.softDelete(id);
        if (result.affected === 0) {
            throw new NotFoundException(
                `Service package with ID '${id}' not found`,
            );
        }
    }
}
