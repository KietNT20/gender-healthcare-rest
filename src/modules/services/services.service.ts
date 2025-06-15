import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { SortServiceDto } from './dto/sort-service.dto';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  /**
   * Tạo mới một dịch vụ
   * @param createServiceDto Dữ liệu đầu vào để tạo dịch vụ
   * @returns Dịch vụ đã được tạo
   */
  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const newService = this.serviceRepo.create({
      ...createServiceDto,
      category: { id: createServiceDto.categoryId },
    });
    return this.serviceRepo.save(newService);
  }

  /**
   * Lấy danh sách dịch vụ với phân trang, lọc và sắp xếp
   * @param pagination Tham số phân trang
   * @param filter Tham số lọc
   * @param sort Tham số sắp xếp
   * @returns Danh sách dịch vụ và thông tin phân trang
   */
  async findAll(
    pagination: PaginationDto,
    filter: FilterServiceDto,
    sort: SortServiceDto,
  ): Promise<Paginated<Service>> {
    const { page = 1, limit = 10 } = pagination;
    const { search, categoryId, minPrice, maxPrice, isActive, featured } = filter;
    const { sortBy = 'createdAt', sortOrder = 'DESC' } = sort;

    const query = this.serviceRepo.createQueryBuilder('service')
      .where({ deletedAt: IsNull() })
      .leftJoinAndSelect('service.category', 'category');

    // Áp dụng bộ lọc
    if (search) {
      query.andWhere('service.name ILIKE :search OR service.description ILIKE :search', { search: `%${search}%` });
    }
    if (categoryId) {
      query.andWhere('service.categoryId = :categoryId', { categoryId });
    }
    if (minPrice !== undefined) {
      query.andWhere('service.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      query.andWhere('service.price <= :maxPrice', { maxPrice });
    }
    if (isActive !== undefined) {
      query.andWhere('service.isActive = :isActive', { isActive });
    }
    if (featured !== undefined) {
      query.andWhere('service.featured = :featured', { featured });
    }

    // Áp dụng sắp xếp
    const allowedSortFields = ['name', 'price', 'duration', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    query.orderBy(`service.${sortField}`, sortOrder);

    // Áp dụng phân trang
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, totalItems] = await query.getManyAndCount();

    return {
      data,
      meta: {
        itemsPerPage: limit,
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Tìm một dịch vụ theo ID
   * @param id ID của dịch vụ
   * @returns Dịch vụ được tìm thấy
   */
  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['category'],
    });

    if (!service) {
      throw new NotFoundException(`Dịch vụ với ID '${id}' không tồn tại`);
    }

    return service;
  }

  /**
   * Cập nhật thông tin dịch vụ
   * @param id ID của dịch vụ
   * @param updateDto Dữ liệu cập nhật
   * @returns Dịch vụ đã được cập nhật
   */
  async update(id: string, updateDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, {
      ...updateDto,
      category: updateDto.categoryId ? { id: updateDto.categoryId } : service.category,
    });
    return this.serviceRepo.save(service);
  }

  /**
   * Xóa mềm một dịch vụ
   * @param id ID của dịch vụ
   */
  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.serviceRepo.softRemove(service);
  }
}