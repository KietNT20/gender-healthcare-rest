import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HealthDataConsentGuard implements CanActivate {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Unauthorized access');
        }

        // Fetch fresh user data to check consent
        const currentUser = await this.userRepository.findOneBy({
            id: user.id,
        });

        if (!currentUser) {
            throw new ForbiddenException('User not found');
        }

        if (!currentUser.healthDataConsent) {
            throw new ForbiddenException(
                'Bạn cần đồng ý cho phép thu thập dữ liệu sức khỏe để sử dụng tính năng này',
            );
        }

        return true;
    }
}
