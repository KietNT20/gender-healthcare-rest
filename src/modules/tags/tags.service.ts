import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';
import slugify from 'slugify';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag)
        private readonly tagRepository: Repository<Tag>,
    ) {}

    async create(createTagDto: CreateTagDto): Promise<Tag> {
        // Check if tag name already exists
        const existingTag = await this.tagRepository.findOne({
            where: { name: createTagDto.name },
        });
        if (existingTag) {
            throw new ConflictException('Tag name already exists');
        }

        // Generate slug if not provided
        const slug =
            createTagDto.slug ||
            slugify(createTagDto.name, { lower: true, strict: true });

        // Check if slug is unique
        const existingSlug = await this.tagRepository.findOne({
            where: { slug },
        });
        if (existingSlug) {
            throw new ConflictException('Tag slug already exists');
        }

        const tag = this.tagRepository.create({
            name: createTagDto.name,
            slug,
        });

        return this.tagRepository.save(tag);
    }

    async findAll(): Promise<Tag[]> {
        return this.tagRepository.find();
    }

    async findOne(id: string): Promise<Tag> {
        const tag = await this.tagRepository.findOne({
            where: { id },
            relations: ['blogs'],
        });
        if (!tag) {
            throw new NotFoundException(`Tag with ID ${id} not found`);
        }
        return tag;
    }

    async findOneByName(name: string): Promise<Tag | null> {
        return this.tagRepository.findOne({ where: { name } });
    }

    async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
        const tag = await this.tagRepository.findOne({ where: { id } });
        if (!tag) {
            throw new NotFoundException(`Tag with ID ${id} not found`);
        }

        // Check if new name already exists
        if (updateTagDto.name && updateTagDto.name !== tag.name) {
            const existingTag = await this.tagRepository.findOne({
                where: { name: updateTagDto.name },
            });
            if (existingTag) {
                throw new ConflictException('Tag name already exists');
            }
        }

        // Generate new slug if name changed or slug provided
        let slug = tag.slug;
        if (updateTagDto.name || updateTagDto.slug) {
            slug =
                updateTagDto.slug ||
                slugify(updateTagDto.name || tag.name, {
                    lower: true,
                    strict: true,
                });
            const existingSlug = await this.tagRepository.findOne({
                where: { slug, id: Not(id) },
            });
            if (existingSlug) {
                throw new ConflictException('Tag slug already exists');
            }
        }

        await this.tagRepository.update(id, {
            name: updateTagDto.name || tag.name,
            slug,
        });

        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const tag = await this.tagRepository.findOne({ where: { id } });
        if (!tag) {
            throw new NotFoundException(`Tag with ID ${id} not found`);
        }
        await this.tagRepository.remove(tag);
    }
}
