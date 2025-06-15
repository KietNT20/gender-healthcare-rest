import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const newService = this.serviceRepo.create(createServiceDto);
    return this.serviceRepo.save(newService);
  }

  async findAll(): Promise<Service[]> {
    return this.serviceRepo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID '${id}' not found`);
    }

    return service;
  }

  async update(id: string, updateDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, updateDto);
    return this.serviceRepo.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.serviceRepo.save({
      ...service,
      deletedAt: new Date(),
    });
  }
}
