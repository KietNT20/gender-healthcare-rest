import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Service } from './entities/service.entity';
import { Image } from '../images/entities/image.entity';
import { CreateServiceImageDto } from './dto/create-service-image.dto';

@Injectable()
export class ServiceImageService {
    constructor(
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        @InjectRepository(Image)
        private readonly imageRepository: Repository<Image>,
    ) {}

    /**
     * Synchronize images with a service based on serviceId
     * @param serviceId The ID of the service
     */
    async syncServiceImages(serviceId: string): Promise<void> {
        // Find the service
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId, deletedAt: IsNull() },
            relations: ['images'],
        });

        if (!service) {
            throw new NotFoundException(
                `Service with ID ${serviceId} not found`,
            );
        }

        // Find all images with entityType 'service' and matching entityId
        const images = await this.imageRepository.find({
            where: {
                entityType: 'service',
                entityId: serviceId,
            },
        });

        // Update the service's images relation
        service.images = images;
        await this.serviceRepository.save(service);
    }

    /**
     * Add an image to a service
     * @param createServiceImageDto DTO containing serviceId and imageId
     */
    async addImageToService(
        createServiceImageDto: CreateServiceImageDto,
    ): Promise<void> {
        const { serviceId, imageId } = createServiceImageDto;

        // Find the service
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId, deletedAt: IsNull() },
            relations: ['images'],
        });

        if (!service) {
            throw new NotFoundException(
                `Service with ID ${serviceId} not found`,
            );
        }

        // Find the image
        const image = await this.imageRepository.findOne({
            where: {
                id: imageId,
                entityType: 'service',
                entityId: serviceId,
            },
        });

        if (!image) {
            throw new NotFoundException(
                `Image with ID ${imageId} not found or not associated with the service`,
            );
        }

        // Add image to the service's images array if not already present
        if (!service.images.some((img) => img.id === imageId)) {
            service.images.push(image);
            await this.serviceRepository.save(service);
        }
    }

    /**
     * Remove an image from a service
     * @param createServiceImageDto DTO containing serviceId and imageId
     */
    async removeImageFromService(
        createServiceImageDto: CreateServiceImageDto,
    ): Promise<void> {
        const { serviceId, imageId } = createServiceImageDto;

        // Find the service
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId, deletedAt: IsNull() },
            relations: ['images'],
        });

        if (!service) {
            throw new NotFoundException(
                `Service with ID ${serviceId} not found`,
            );
        }

        // Filter out the image
        service.images = service.images.filter((img) => img.id !== imageId);
        await this.serviceRepository.save(service);
    }
}
