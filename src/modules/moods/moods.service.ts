import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { Repository } from 'typeorm';
import { CreateMoodDto } from './dto/create-mood.dto';
import { MoodQueryDto } from './dto/mood-query.dto';
import { UpdateMoodDto } from './dto/update-mood.dto';
import { Mood } from './entities/mood.entity';

@Injectable()
export class MoodsService {
    constructor(
        @InjectRepository(Mood)
        private readonly moodRepository: Repository<Mood>,
    ) {}

    async create(createMoodDto: CreateMoodDto): Promise<Mood> {
        const mood = this.moodRepository.create(createMoodDto);
        await this.moodRepository.save(mood);

        const data = await this.moodRepository.findOneBy({ id: mood.id });

        if (!data) {
            throw new InternalServerErrorException(
                'Đã xảy ra lỗi khi tạo tâm trạng',
            );
        }

        return data;
    }

    async findAll(moodQueryDto: MoodQueryDto): Promise<Paginated<Mood>> {
        const { name, sortBy, sortOrder, page, limit } = moodQueryDto;

        let pageNumber = page || 1;
        let limitNumber = limit || 10;

        const query = this.moodRepository.createQueryBuilder('mood');

        if (name) {
            query.andWhere('mood.name ILIKE :name', { name: `%${name}%` });
        }

        if (sortBy) {
            query.orderBy(`mood.${sortBy}`, sortOrder);
        }

        const skip = (pageNumber - 1) * limitNumber;
        query.skip(skip).take(limitNumber);

        const [result, totalItems] = await query.getManyAndCount();
        const totalPages = Math.ceil(totalItems / limitNumber);

        return {
            data: result,
            meta: {
                itemsPerPage: limitNumber,
                totalItems,
                currentPage: pageNumber,
                totalPages,
            },
        };
    }

    findOne(id: string): Promise<Mood | null> {
        const data = this.moodRepository.findOneBy({ id });

        if (!data) {
            throw new NotFoundException('Không tìm thấy ID');
        }

        return data;
    }

    async update(
        id: string,
        updateMoodDto: UpdateMoodDto,
    ): Promise<{ data: Promise<Mood | null> }> {
        if (!id) {
            throw new BadRequestException('ID không được để trống');
        }

        await this.moodRepository.update(id, updateMoodDto);

        const data = this.moodRepository.findOneBy({ id });

        return {
            data: data,
        };
    }

    async remove(id: string): Promise<void> {
        await this.moodRepository.delete(id);
    }
}
