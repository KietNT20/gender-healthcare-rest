import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { Repository } from 'typeorm';
import { CreateMoodDto } from './dto/create-mood.dto';
import { MoodQueryDto } from './dto/query-mood.dto';
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

        const pageNumber = page || 1;
        const limitNumber = limit || 10;

        const query = this.moodRepository.createQueryBuilder('mood');

        if (name) {
            query.andWhere('mood.name ILIKE :name', { name: `%${name}%` });
        }

        if (sortBy) {
            query.orderBy(`mood.${sortBy}`, sortOrder);
        } else {
            query.orderBy('mood.createdAt', 'DESC');
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

    async findOne(id: string): Promise<Mood> {
        if (!id) {
            throw new NotFoundException('ID không được để trống');
        }
        const data = await this.moodRepository.findOneBy({ id });
        if (!data) {
            throw new NotFoundException(
                'Không tìm thấy tâm trạng với ID là ' + id,
            );
        }
        return data;
    }

    async update(id: string, updateMoodDto: UpdateMoodDto): Promise<Mood> {
        const mood = await this.moodRepository.findOneBy({ id });

        if (!mood) {
            throw new NotFoundException(
                'Không tìm thấy tâm trạng với ID là ' + id,
            );
        }

        const updatedMood = this.moodRepository.merge(mood, updateMoodDto);

        return this.moodRepository.save(updatedMood);
    }

    async remove(id: string): Promise<void> {
        const res = await this.moodRepository.delete(id);
        if (res.affected === 0) {
            throw new NotFoundException(
                'Không tìm thấy tâm trạng với ID là ' + id,
            );
        }
    }
}
