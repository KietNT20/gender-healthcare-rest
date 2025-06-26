import { Test, TestingModule } from '@nestjs/testing';
import { RevenueStatsController } from './revenue-stats.controller';

describe('RevenueStatsController', () => {
    let controller: RevenueStatsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RevenueStatsController],
        }).compile();

        controller = module.get<RevenueStatsController>(RevenueStatsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
