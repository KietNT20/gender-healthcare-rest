import { Test, TestingModule } from '@nestjs/testing';
import { RevenueStatsService } from './revenue-stats.service';

describe('RevenueStatsService', () => {
  let service: RevenueStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevenueStatsService],
    }).compile();

    service = module.get<RevenueStatsService>(RevenueStatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
