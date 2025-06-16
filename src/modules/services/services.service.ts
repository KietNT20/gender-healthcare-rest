import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import slugify from 'slugify';
import { IsNull, Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceProfileDto, ServiceResponseDto } from './dto/service-response.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  /**
   * Tạo mới một dịch vụ
   * @param createServiceDto Dữ liệu đầu vào để tạo dịch vụ
   * @returns Dịch vụ đã được tạo
   */
  async create(createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    // Check if slug already exists
    const existingService = await this.serviceRepo.findOne({
      where: { slug: createServiceDto.slug, deletedAt: IsNull() },
    });

    if (existingService) {
      throw new ConflictException('Slug already exists');
    }

    const newService = this.serviceRepo.create({
      ...createServiceDto,
      category: { id: createServiceDto.categoryId },
      isActive: createServiceDto.isActive ?? true,
      featured: createServiceDto.featured ?? false,
    });

    const savedService = await this.serviceRepo.save(newService);
    this.logger.debug(`Created Service: ${JSON.stringify(savedService)}`);
    return this.toServiceResponse(savedService);
  }

  /**
   * Lấy danh sách dịch vụ với phân trang, lọc và sắp xếp
   * @param serviceQueryDto Tham số truy vấn bao gồm phân trang, lọc và sắp xếp
   * @returns Danh sách dịch vụ và thông tin phân trang
   */
  async findAll(serviceQueryDto: ServiceQueryDto): Promise<Paginated<ServiceResponseDto>> {
    const queryBuilder = this.serviceRepo
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      .where('service.deletedAt IS NULL');

    this.applyServiceFilters(queryBuilder, serviceQueryDto);

    const offset = (serviceQueryDto.page! - 1) * serviceQueryDto.limit!;
    queryBuilder.skip(offset).take(serviceQueryDto.limit!);

    const allowedSortFields = ['name', 'price', 'duration', 'createdAt', 'updatedAt'];
    if (!serviceQueryDto.sortBy) {
      serviceQueryDto.sortBy = 'createdAt';
    }
    const sortField = allowedSortFields.includes(serviceQueryDto.sortBy)
      ? serviceQueryDto.sortBy
      : 'createdAt';
    queryBuilder.orderBy(`service.${sortField}`, serviceQueryDto.sortOrder);

    const [services, totalItems] = await queryBuilder.getManyAndCount();

    // Debug categoryId
    services.forEach((service) => {
      this.logger.debug(`Service ID: ${service.id}, Category ID: ${service.category?.id}`);
    });

    return {
      data: services.map((service) => this.toServiceResponse(service)),
      meta: {
        itemsPerPage: serviceQueryDto.limit!,
        totalItems,
        currentPage: serviceQueryDto.page!,
        totalPages: Math.ceil(totalItems / serviceQueryDto.limit!),
      },
    };
  }

  /**
   * Áp dụng các bộ lọc cho truy vấn dịch vụ
   * @param queryBuilder QueryBuilder để áp dụng bộ lọc
   * @param serviceQueryDto DTO chứa các tiêu chí lọc
   */
  private applyServiceFilters(queryBuilder: any, serviceQueryDto: ServiceQueryDto): void {
    const { search, categoryId, minPrice, maxPrice, isActive, featured } = serviceQueryDto;

    if (search) {
      queryBuilder.andWhere('service.name ILIKE :search OR service.description ILIKE :search', {
        search: `%${search}%`,
      });
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
  }

  /**
   * Tìm một dịch vụ theo ID
   * @param id ID của dịch vụ
   * @returns Dịch vụ được tìm thấy
   */
  async findOne(id: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['category'],
    });

    if (!service) {
      throw new NotFoundException(`Dịch vụ với ID '${id}' không tồn tại`);
    }

    // Debug categoryId
    this.logger.debug(`Service ID: ${service.id}, Category ID: ${service.category?.id}`);

    return this.toServiceResponse(service);
  }

  /**
   * Cập nhật thông tin dịch vụ
   * @param id ID của dịch vụ
   * @param updateDto Dữ liệu cập nhật
   * @returns Dịch vụ đã được cập nhật
   */
  async update(id: string, updateDto: UpdateServiceProfileDto): Promise<ServiceResponseDto> {
    const service = await this.serviceRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['category'],
    });

    if (!service) {
      throw new NotFoundException(`Dịch vụ với ID '${id}' không tồn tại`);
    }

    // Check slug uniqueness if slug is being updated
    if (updateDto.slug && updateDto.slug !== service.slug) {
      const existingService = await this.serviceRepo.findOne({
        where: { slug: updateDto.slug, deletedAt: IsNull() },
      });
      if (existingService && existingService.id !== id) {
        throw new ConflictException('Slug already exists');
      }
    }

    Object.assign(service, {
      ...updateDto,
      category: updateDto.categoryId ? { id: updateDto.categoryId } : service.category,
    });

    const updatedService = await this.serviceRepo.save(service);
    return this.toServiceResponse(updatedService);
  }

  /**
   * Xóa mềm một dịch vụ
   * @param id ID của dịch vụ
   */
  async remove(id: string): Promise<void> {
    const service = await this.serviceRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!service) {
      throw new NotFoundException(`Dịch vụ với ID '${id}' không tồn tại`);
    }

    await this.serviceRepo.softRemove(service);
  }

  private toServiceResponse(service: Service): ServiceResponseDto {
    const response = plainToClass(
      ServiceResponseDto,
      {
        ...service,
        categoryId: service.category?.id || null,
      },
      { excludeExtraneousValues: true },
    );
    return response;
  }
}