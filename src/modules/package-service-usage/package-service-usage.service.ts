import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreatePackageServiceUsageDto } from './dto/create-package-service-usage.dto';
import { UpdatePackageServiceUsageDto } from './dto/update-package-service-usage.dto';
import { PackageServiceUsage } from './entities/package-service-usage.entity';
import { UserPackageSubscription } from '../user-package-subscriptions/entities/user-package-subscription.entity';
import { Service } from '../services/entities/service.entity';
import { PaymentStatusType } from 'src/enums';

@Injectable()
export class PackageServiceUsageService {
  constructor(
    @InjectRepository(PackageServiceUsage)
    private packageServiceUsageRepository: Repository<PackageServiceUsage>,
    @InjectRepository(UserPackageSubscription)
    private subscriptionRepository: Repository<UserPackageSubscription>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  async create(createDto: CreatePackageServiceUsageDto) {
    const { subscriptionId, serviceId, usageDate } = createDto;

    // Kiểm tra UserPackageSubscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, deletedAt: IsNull() },
      relations: ['package', 'package.packageServices', 'package.packageServices.service', 'payment'],
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID '${subscriptionId}' not found`);
    }

    // Kiểm tra trạng thái thanh toán
    if (!subscription.payment || subscription.payment.status !== PaymentStatusType.COMPLETED) {
      throw new BadRequestException(`Subscription '${subscriptionId}' has not been paid`);
    }

    // Kiểm tra Service
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, deletedAt: IsNull() },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID '${serviceId}' not found`);
    }

    // Kiểm tra Service có thuộc gói không
    const isServiceInPackage = subscription.package.packageServices.some(
      (pkgService) => pkgService.service.id === serviceId,
    );
    if (!isServiceInPackage) {
      throw new BadRequestException(`Service '${serviceId}' is not included in the package`);
    }

    // Kiểm tra số lần sử dụng so với giới hạn
    const usageCount = await this.packageServiceUsageRepository.count({
      where: {
        subscription: { id: subscriptionId },
        deletedAt: IsNull(),
      },
    });
    const quantityLimit = subscription.package.maxServicesPerMonth ?? Number.MAX_SAFE_INTEGER;
    if (typeof quantityLimit !== 'number' || usageCount >= quantityLimit) {
      throw new BadRequestException(
        `Usage limit exceeded. Maximum ${quantityLimit} services per month allowed.`,
      );
    }

    // Tạo bản ghi PackageServiceUsage
    const packageServiceUsage = this.packageServiceUsageRepository.create({
      usageDate: usageDate ? new Date(usageDate) : new Date(),
      subscription: { id: subscriptionId },
      service: { id: serviceId },
    });

    return await this.packageServiceUsageRepository.save(packageServiceUsage);
  }

  async findAll() {
    return this.packageServiceUsageRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['subscription', 'service'],
    });
  }

  async findOne(id: string) {
    const packageServiceUsage = await this.packageServiceUsageRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['subscription', 'service'],
    });
    if (!packageServiceUsage) {
      throw new NotFoundException(`Package service usage with ID '${id}' not found`);
    }
    return packageServiceUsage;
  }

  async update(id: string, updateDto: UpdatePackageServiceUsageDto) {
    const packageServiceUsage = await this.findOne(id);
    this.packageServiceUsageRepository.merge(packageServiceUsage, updateDto);
    return await this.packageServiceUsageRepository.save(packageServiceUsage);
  }

  async remove(id: string) {
    const packageServiceUsage = await this.findOne(id);
    await this.packageServiceUsageRepository.softDelete(id);
    return { message: 'Package service usage deleted successfully' };
  }
}