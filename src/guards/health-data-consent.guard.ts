import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HealthDataConsentGuard implements CanActivate {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const user = request.user as User;

        if (!user) {
            throw new UnauthorizedException('Yêu cầu cần được xác thực');
        }

        // Fetch fresh user data to check consent
        const currentUser = await this.userRepository.findOneBy({
            id: user.id,
        });

        if (!currentUser) {
            throw new ForbiddenException('Không có quyền truy cập');
        }

        if (!currentUser.healthDataConsent) {
            throw new ForbiddenException(
                'Bạn cần đồng ý cho phép thu thập dữ liệu sức khỏe để sử dụng tính năng này',
            );
        }

        return true;
    }
}
