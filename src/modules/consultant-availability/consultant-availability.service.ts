import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { RolesNameEnum } from 'src/enums';
import { Repository } from 'typeorm';
import { ConsultantProfile } from '../consultant-profiles/entities/consultant-profile.entity';
import { User } from '../users/entities/user.entity';
import { ConsultantAvailabilityCrudService } from './consultant-availability-crud.service';
import { CreateConsultantAvailabilityDto } from './dto/create-consultant-availability.dto';
import { QueryConsultantAvailabilityDto } from './dto/query-consultant-availability.dto';
import { UpdateConsultantAvailabilityDto } from './dto/update-consultant-availability.dto';
import { ConsultantAvailability } from './entities/consultant-availability.entity';

@Injectable()
export class ConsultantAvailabilityService {
    constructor(
        private readonly crudService: ConsultantAvailabilityCrudService,
        @InjectRepository(ConsultantProfile)
        private readonly profileRepository: Repository<ConsultantProfile>,
    ) {}

    private async getProfileByUserId(
        userId: string,
    ): Promise<ConsultantProfile> {
        const profile = await this.profileRepository.findOne({
            where: { user: { id: userId } },
        });
        if (!profile) {
            throw new NotFoundException(
                `Không tìm thấy hồ sơ tư vấn viên cho người dùng này.`,
            );
        }
        return profile;
    }

    async create(
        currentUser: User,
        createDto: CreateConsultantAvailabilityDto,
    ): Promise<ConsultantAvailability> {
        const profile = await this.getProfileByUserId(currentUser.id);
        return this.crudService.create(profile, createDto);
    }

    async findAll(
        currentUser: User,
        queryDto: QueryConsultantAvailabilityDto,
    ): Promise<Paginated<ConsultantAvailability>> {
        // Nếu là Admin/Manager, họ có thể xem lịch của bất kỳ ai bằng cách truyền consultantId
        const isAdminOrManager = [
            RolesNameEnum.ADMIN,
            RolesNameEnum.MANAGER,
        ].includes(currentUser.role.name);

        if (isAdminOrManager && queryDto.consultantId) {
            return this.crudService.findAll(queryDto);
        }

        // Nếu là consultant, họ chỉ xem được lịch của mình
        const profile = await this.getProfileByUserId(currentUser.id);
        queryDto.consultantId = profile.id;

        return this.crudService.findAll(queryDto);
    }

    async findOne(
        id: string,
        currentUser: User,
    ): Promise<ConsultantAvailability> {
        const availability = await this.crudService.findOneById(id);
        const profile = await this.getProfileByUserId(currentUser.id);

        const isAdminOrManager = [
            RolesNameEnum.ADMIN,
            RolesNameEnum.MANAGER,
        ].includes(currentUser.role.name);

        // Chỉ Admin/Manager hoặc chính consultant đó mới được xem
        if (
            !isAdminOrManager &&
            availability.consultantProfile.id !== profile.id
        ) {
            throw new ForbiddenException(
                'Bạn không có quyền xem lịch làm việc này.',
            );
        }

        return availability;
    }

    async update(
        id: string,
        currentUser: User,
        updateDto: UpdateConsultantAvailabilityDto,
    ): Promise<ConsultantAvailability> {
        await this.findOne(id, currentUser); // Check ownership before updating
        return this.crudService.update(id, updateDto);
    }

    async remove(id: string, currentUser: User): Promise<void> {
        await this.findOne(id, currentUser); // Check ownership before removing
        return this.crudService.remove(id);
    }
}
