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

        // Generate unique slug
        const baseSlug = slugify(createTagDto.name, {
            lower: true,
            strict: true,
        });
        const slug = await this.generateUniqueSlug(baseSlug);

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

        // Generate new slug if name changed
        let slug = tag.slug;
        if (updateTagDto.name) {
            const baseSlug = slugify(updateTagDto.name, {
                lower: true,
                strict: true,
            });
            slug = await this.generateUniqueSlug(baseSlug, id);
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

    private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
        let slug = baseSlug;
        let counter = 1;

        while (await this.isSlugExists(slug, excludeId)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    private async isSlugExists(slug: string, excludeId?: string): Promise<boolean> {
        const queryBuilder = this.tagRepository
            .createQueryBuilder('tag')
            .where('tag.slug = :slug', { slug })
            .andWhere('tag.id != :excludeId', { excludeId });

        const count = await queryBuilder.getCount();
        return count > 0;
    }
}
