import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, IsNull, Repository } from 'typeorm';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { Service } from '../services/entities/service.entity';
import { CreatePackageServiceDto } from './dto/create-package-service.dto';
import { UpdatePackageServiceDto } from './dto/update-package-service.dto';
import { PackageService } from './entities/package-service.entity';

@Injectable()
export class PackageServicesService {
    constructor(
        @InjectRepository(PackageService)
        private packageServiceRepository: Repository<PackageService>,
        @InjectRepository(ServicePackage)
        private packageRepository: Repository<ServicePackage>,
        @InjectRepository(Service)
        private serviceRepository: Repository<Service>,
    ) {}

    async create(createDto: CreatePackageServiceDto) {
        const { packageId, serviceId, ...packageServiceData } = createDto;

        // Kiểm tra ServicePackage
        const packageEntity = await this.packageRepository.findOne({
            where: { id: packageId, deletedAt: IsNull() },
        });
        if (!packageEntity) {
            throw new NotFoundException(
                `Service package with ID '${packageId}' not found`,
            );
        }

        // Kiểm tra Service
        const serviceEntity = await this.serviceRepository.findOne({
            where: { id: serviceId, deletedAt: IsNull() },
        });
        if (!serviceEntity) {
            throw new NotFoundException(
                `Service with ID '${serviceId}' not found`,
            );
        }

        const packageService = this.packageServiceRepository.create({
            ...packageServiceData,
            servicePackage: { id: packageId },
            service: { id: serviceId },
        });

        return await this.packageServiceRepository.save(packageService);
    }

    async findAll() {
        return this.packageServiceRepository.find({
            where: { deletedAt: IsNull() },
            relations: ['servicePackage', 'service'],
        });
    }

    async findOne(id: string) {
        const packageService = await this.packageServiceRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['servicePackage', 'service'],
        });
        if (!packageService) {
            throw new NotFoundException(
                `Package service with ID '${id}' not found`,
            );
        }
        return packageService;
    }

    async update(id: string, updateDto: UpdatePackageServiceDto) {
        const packageService = await this.findOne(id);
        this.packageServiceRepository.merge(
            packageService,
            updateDto as DeepPartial<PackageService>,
        );
        return await this.packageServiceRepository.save(packageService);
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.packageServiceRepository.softDelete(id);
    }
}
