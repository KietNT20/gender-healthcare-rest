import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import { UpdateImageDto } from './dto/update-image.dto';
import { Image } from './entities/image.entity';

@Injectable()
export class ImagesService {
    constructor(
        @InjectRepository(Image)
        private readonly imageRepository: Repository<Image>,
        private readonly filesService: FilesService,
    ) {}

    async findOne(id: string): Promise<Image> {
        const image = await this.imageRepository.findOneBy({ id });
        if (!image) {
            throw new NotFoundException(`Image with ID ${id} not found`);
        }
        return image;
    }

    async update(id: string, updateImageDto: UpdateImageDto): Promise<Image> {
        const image = await this.findOne(id);
        this.imageRepository.merge(image, updateImageDto);
        return this.imageRepository.save(image);
    }

    async remove(id: string): Promise<void> {
        await this.filesService.deleteImage(id);
    }

    async findByEntity(entityType: string, entityId: string): Promise<Image[]> {
        return this.filesService.getImagesByEntity(entityType, entityId);
    }
}
