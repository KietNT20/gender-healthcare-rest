import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { ServicePackage } from './entities/service-package.entity';
import { PackageService } from '../package-services/entities/package-service.entity';
import { IsNull } from 'typeorm';
import slugify from 'slugify';

@Injectable()
export class ServicePackagesService {
  constructor(
    @InjectRepository(ServicePackage)
    private packageRepository: Repository<ServicePackage>,
    @InjectRepository(PackageService)
    private packageServiceRepository: Repository<PackageService>,
  ) {}

  async create(createDto: CreateServicePackageDto) {
    const { name, services, ...packageData } = createDto;

    const slug = slugify(name, { lower: true, strict: true });
    const existingPackage = await this.packageRepository.findOne({ where: { slug, deletedAt: IsNull() } });
    if (existingPackage) {
      throw new NotFoundException(`Package with name '${name}' already exists`);
    }

    const packageEntity = this.packageRepository.create({
      ...packageData,
      name,
      slug,
      isActive: createDto.isActive ?? true,
    });

    const savedPackage = await this.packageRepository.save(packageEntity);

    if (services && services.length > 0) {
      const packageServices = services.map(serviceId => this.packageServiceRepository.create({
        package: { id: savedPackage.id },
        service: { id: serviceId },
        quantityLimit: 10,
        discountPercentage: 0,
      }));
      await this.packageServiceRepository.save(packageServices);
    }

    return savedPackage;
  }

  async findAll() {
    return this.packageRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['packageServices', 'subscriptions'],
    });
  }

  async findOne(id: string) {
    const packageEntity = await this.packageRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['packageServices', 'subscriptions'],
    });
    if (!packageEntity) {
      throw new NotFoundException(`Package with ID '${id}' not found`);
    }
    return packageEntity;
  }

  async update(id: string, updateDto: UpdateServicePackageDto) {
    const packageEntity = await this.findOne(id);
    const updatedPackage = this.packageRepository.merge(packageEntity, updateDto);
    return await this.packageRepository.save(updatedPackage);
  }

  async remove(id: string) {
    const packageEntity = await this.findOne(id);
    await this.packageRepository.softDelete(id);
  }
}