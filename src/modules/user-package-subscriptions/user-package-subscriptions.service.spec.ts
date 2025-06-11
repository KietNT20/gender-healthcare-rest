import { Test, TestingModule } from '@nestjs/testing';
import { UserPackageSubscriptionsService } from './user-package-subscriptions.service';

describe('UserPackageSubscriptionsService', () => {
    let service: UserPackageSubscriptionsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserPackageSubscriptionsService],
        }).compile();

        service = module.get<UserPackageSubscriptionsService>(
            UserPackageSubscriptionsService,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
