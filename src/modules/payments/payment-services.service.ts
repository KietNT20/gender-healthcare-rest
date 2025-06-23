import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SortOrder } from 'src/enums';
import { IsNull, Like, Repository } from 'typeorm';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { Service } from '../services/entities/service.entity';
import { GetPayablePackagesDto } from './dto/get-payable-packages.dto';

@Injectable()
export class PaymentServicesService {
    constructor(
        @InjectRepository(Service)
        private serviceRepository: Repository<Service>,
        @InjectRepository(ServicePackage)
        private packageRepository: Repository<ServicePackage>,
    ) {}

    /**
     * Lấy danh sách dịch vụ có thể thanh toán
     */
    async getAvailableServices(query: GetPayablePackagesDto) {
        const { search, isActive = true } = query;

        const services = await this.serviceRepository.find({
            where: {
                deletedAt: IsNull(),
                ...(isActive !== undefined && { isActive }),
                ...(search && { name: Like(`%${search}%`) }),
            },
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
            message: 'Lấy danh sách dịch vụ thành công',
        };
    }

    /**
     * Lấy danh sách gói dịch vụ có thể thanh toán
     */
    async getAvailablePackages(query: GetPayablePackagesDto) {
        const { search, isActive = true } = query;

        const packages = await this.packageRepository.find({
            where: {
                deletedAt: IsNull(),
                ...(isActive !== undefined && { isActive }),
                ...(search && { name: Like(`%${search}%`) }),
            },
            select: [
                'id',
                'name',
                'price',
                'durationMonths',
                'maxServicesPerMonth',
                'isActive',
            ],
            order: { createdAt: SortOrder.DESC },
        });

        return {
            success: true,
            data: packages,
        };
    }
}
