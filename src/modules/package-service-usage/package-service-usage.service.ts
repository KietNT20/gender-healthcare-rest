import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePackageServiceUsageDto } from './dto/create-package-service-usage.dto';
import { UpdatePackageServiceUsageDto } from './dto/update-package-service-usage.dto';
import { PackageServiceUsage } from './entities/package-service-usage.entity';
import { UserPackageSubscription } from '../user-package-subscriptions/entities/user-package-subscription.entity';
import { Service } from '../services/entities/service.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { IsNull } from 'typeorm';

@Injectable()
export class PackageServiceUsageService {
  constructor(
    @InjectRepository(PackageServiceUsage)
    private packageServiceUsageRepository: Repository<PackageServiceUsage>,
    @InjectRepository(UserPackageSubscription)
    private subscriptionRepository: Repository<UserPackageSubscription>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async create(createDto: CreatePackageServiceUsageDto) {
    const { subscriptionId, serviceId, appointmentId, usageDate } = createDto;

    // Kiểm tra UserPackageSubscription
    const subscription = await this.subscriptionRepository.findOne({ 
      where: { id: subscriptionId, deletedAt: IsNull() } 
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID '${subscriptionId}' not found`);
    }

    // Kiểm tra Service
    const service = await this.serviceRepository.findOne({ 
      where: { id: serviceId, deletedAt: IsNull() } 
    });
    if (!service) {
      throw new NotFoundException(`Service with ID '${serviceId}' not found`);
    }

    // Kiểm tra Appointment
    const appointment = await this.appointmentRepository.findOne({ 
      where: { id: appointmentId, deletedAt: IsNull() } 
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${appointmentId}' not found`);
    }

    const packageServiceUsage = this.packageServiceUsageRepository.create({
      usageDate: usageDate || new Date(),
      subscription: { id: subscriptionId },
      service: { id: serviceId },
      appointment: { id: appointmentId },
    });

    return await this.packageServiceUsageRepository.save(packageServiceUsage);
  }

  async findAll() {
    return this.packageServiceUsageRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['subscription', 'service', 'appointment'],
    });
  }

  async findOne(id: string) {
    const packageServiceUsage = await this.packageServiceUsageRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['subscription', 'service', 'appointment'],
    });
    if (!packageServiceUsage) {
      throw new NotFoundException(`Package service usage with ID '${id}' not found`);
    }
    return packageServiceUsage;
  }

  async update(id: string, updateDto: UpdatePackageServiceUsageDto) {
    const packageServiceUsage = await this.findOne(id);
    
    if (updateDto.usageDate) {
      packageServiceUsage.usageDate = updateDto.usageDate;
    }

    return await this.packageServiceUsageRepository.save(packageServiceUsage);
  }

  async remove(id: string) {
    const packageServiceUsage = await this.findOne(id);
    await this.packageServiceUsageRepository.softDelete(id);
    return { message: 'Package service usage deleted successfully' };
  }
}