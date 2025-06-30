import { Test, TestingModule } from '@nestjs/testing';
import { ServicePackagesStatsService } from './service-packages-stats.service';

describe('ServicePackagesStatsService', () => {
    let service: ServicePackagesStatsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ServicePackagesStatsService],
        }).compile();

        service = module.get<ServicePackagesStatsService>(
            ServicePackagesStatsService,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
