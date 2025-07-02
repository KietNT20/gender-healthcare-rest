import { Test, TestingModule } from '@nestjs/testing';
import { ServicePackagesStatsController } from './service-packages-stats.controller';

describe('ServicePackagesStatsController', () => {
    let controller: ServicePackagesStatsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ServicePackagesStatsController],
        }).compile();

        controller = module.get<ServicePackagesStatsController>(
            ServicePackagesStatsController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
