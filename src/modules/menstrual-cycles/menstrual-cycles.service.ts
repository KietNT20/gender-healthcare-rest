import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SortOrder } from 'src/enums';
import { MenstrualPredictionsService } from 'src/modules/menstrual-predictions/menstrual-predictions.service';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateMenstrualCycleDto } from './dto/create-menstrual-cycle.dto';
import { UpdateMenstrualCycleDto } from './dto/update-menstrual-cycle.dto';
import { MenstrualCycle } from './entities/menstrual-cycle.entity';

@Injectable()
export class MenstrualCyclesService {
    constructor(
        @InjectRepository(MenstrualCycle)
        private readonly cycleRepository: Repository<MenstrualCycle>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly predictionsService: MenstrualPredictionsService,
    ) {}

    async create(
        userId: string,
        createDto: CreateMenstrualCycleDto,
    ): Promise<MenstrualCycle> {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException(
                `Không tìm thấy người dùng với ID ${userId}`,
            );
        }

        const startDate = new Date(createDto.cycleStartDate);
        const endDate = new Date(createDto.cycleEndDate);

        // Tính toán độ dài kỳ kinh
        const periodLength =
            Math.floor(
                (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
            ) + 1;

        // Tìm chu kỳ gần nhất trước đó để tính độ dài chu kỳ
        const lastCycle = await this.cycleRepository.findOne({
            where: { user: { id: userId } },
            order: { cycleStartDate: SortOrder.DESC },
        });

        let cycleLength: number | undefined;
        if (lastCycle) {
            cycleLength = Math.floor(
                (startDate.getTime() -
                    new Date(lastCycle.cycleStartDate).getTime()) /
                    (1000 * 3600 * 24),
            );
        }

        // Lấy 5 chu kỳ gần nhất (chưa tính chu kỳ mới)
        const recentCycles = await this.cycleRepository.find({
            where: { user: { id: userId } },
            order: { cycleStartDate: SortOrder.DESC },
            take: 5,
        });

        // Tạo mảng tạm gồm 5 chu kỳ cũ + chu kỳ mới (chưa lưu)
        const tempCycles = [
            {
                ...new MenstrualCycle(),
                cycleLength,
            },
            ...recentCycles,
        ].filter((c) => typeof c.cycleLength === 'number' && c.cycleLength > 0);

        if (this.isIrregularCycle(tempCycles)) {
            throw new BadRequestException(
                'Chu kỳ của bạn có dấu hiệu rối loạn, vui lòng xác nhận lại dữ liệu hoặc tham khảo ý kiến bác sĩ.',
            );
        }

        // Đến đây mới tạo và lưu chu kỳ mới
        if (lastCycle) {
            // Cập nhật độ dài cho chu kỳ trước đó
            await this.cycleRepository.update(lastCycle.id, { cycleLength });
        }

        const newCycle = this.cycleRepository.create({
            user,
            cycleStartDate: startDate,
            cycleEndDate: endDate,
            periodLength,
            // cycleLength sẽ được cập nhật khi chu kỳ tiếp theo được tạo
        });

        const savedCycle = await this.cycleRepository.save(newCycle);

        // Kích hoạt dịch vụ dự đoán sau khi tạo chu kỳ mới
        await this.predictionsService.predictAndUpdate(userId);

        return savedCycle;
    }

    async findAll(userId: string): Promise<MenstrualCycle[]> {
        return this.cycleRepository.find({
            where: { user: { id: userId } },
            order: { cycleStartDate: 'DESC' },
        });
    }

    async findOne(id: string, userId: string): Promise<MenstrualCycle> {
        const cycle = await this.cycleRepository.findOne({
            where: { id, user: { id: userId } },
        });
        if (!cycle) {
            throw new NotFoundException(`Không tìm thấy chu kỳ với ID ${id}`);
        }
        return cycle;
    }

    async update(
        id: string,
        userId: string,
        updateDto: UpdateMenstrualCycleDto,
    ): Promise<MenstrualCycle> {
        const cycle = await this.findOne(id, userId);

        this.cycleRepository.merge(cycle, updateDto);
        const updatedCycle = await this.cycleRepository.save(cycle);

        // Kích hoạt lại dự đoán nếu ngày bắt đầu/kết thúc thay đổi
        if (updateDto.cycleStartDate || updateDto.cycleEndDate) {
            await this.predictionsService.predictAndUpdate(userId);
        }

        return updatedCycle;
    }

    async remove(id: string, userId: string): Promise<void> {
        const cycle = await this.findOne(id, userId);
        await this.cycleRepository.softDelete(cycle.id);
        await this.predictionsService.predictAndUpdate(userId);
    }

    // Kiểm tra rối loạn chu kỳ: nếu có chu kỳ lệch quá threshold ngày so với trung bình thì coi là rối loạn
    private isIrregularCycle(
        cycles: MenstrualCycle[] = [],
        threshold = 7,
    ): boolean {
        if (!Array.isArray(cycles) || cycles.length < 2) return false;
        const cycleLengths = cycles
            .map((c) => c?.cycleLength)
            .filter(
                (length): length is number =>
                    typeof length === 'number' && length > 0,
            );
        if (cycleLengths.length < 2) return false;
        const avg =
            cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
        return cycleLengths.some(
            (length) => Math.abs(length - avg) > threshold,
        );
    }
}
