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

    findOne(id: string): Promise<Mood | null> {
        const data = this.moodRepository.findOneBy({ id });

        if (!data) {
            throw new NotFoundException('Không tìm thấy ID là ' + id);
        }

        return data;
    }

    async update(id: string, updateMoodDto: UpdateMoodDto): Promise<Mood> {
        if (!id) {
            throw new BadRequestException('ID không được để trống');
        }

        await this.moodRepository.update(id, {
            ...updateMoodDto,
            updatedAt: new Date(),
        });

        const updatedData = await this.moodRepository.findOneBy({ id });

        if (!updatedData) {
            throw new NotFoundException(
                'Không tìm thấy tâm trạng với ID là ' + id,
            );
        }

        return updatedData;
    }

    async remove(id: string): Promise<void> {
        const res = await this.moodRepository.delete(id);
        if (!res.affected) {
            throw new NotFoundException(
                'Không tìm thấy tâm trạng với ID là ' + id,
            );
        }
    }
}
