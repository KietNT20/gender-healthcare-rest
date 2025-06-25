import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { GetPayablePackagesDto } from './dto/get-payable-packages.dto';
import { Like, IsNull } from 'typeorm';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class PaymentServicesService {
    constructor(
        @InjectRepository(ServicePackage)
        private packageRepository: Repository<ServicePackage>,
        @InjectRepository(Service)
        private serviceRepository: Repository<Service>,
    ) {}

    async getAvailablePackages(query: GetPayablePackagesDto) {
        const { search, isActive = true } = query;

        const where: any = {
            deletedAt: IsNull(),
        };

        // Thêm điều kiện isActive nếu được cung cấp
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Thêm điều kiện search nếu có
        if (search) {
            where.name = Like(`%${search}%`);
        }

        const packages = await this.packageRepository.find({
            where,
            select: [
                'id',
                'name',
                'price',
                'durationMonths',
                'maxServicesPerMonth',
                'isActive',
            ],
            order: { createdAt: 'DESC' },
        });

        return {
            success: true,
            data: packages,
        };
    }

    // Giữ nguyên getAvailableServices nếu cần, sửa tương tự nếu có lỗi
    async getAvailableServices(query: GetPayablePackagesDto) {
        const { search, isActive = true } = query;

        const where: any = {
            deletedAt: IsNull(),
        };

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (search) {
            where.name = Like(`%${search}%`);
        }

        const services = await this.serviceRepository.find({
            where,
            select: [
                'id',
                'name',
                'slug',
                'description',
                'shortDescription',
                'price',
                'duration',
                'isActive',
                'featured',
            ],
            relations: ['category'],
            order: { createdAt: 'DESC' },
        });

        return {
            success: true,
            data: services,
        };
    }
}