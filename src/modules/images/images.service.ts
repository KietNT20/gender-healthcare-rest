import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import { Image } from './entities/image.entity';

@Injectable()
export class ImagesService {
    constructor(
        @InjectRepository(Image)
        private readonly imageRepository: Repository<Image>,
        private readonly filesService: FilesService,
    ) {}
}
