import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesNameEnum } from 'src/enums';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserDashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async getCustomerDashboard() {
        const customers = await this.userRepository.find({
            where: {
                role: {
                    name: RolesNameEnum.CUSTOMER,
                },
            },
        });
    }
}
