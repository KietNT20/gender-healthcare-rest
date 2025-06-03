import { Test, TestingModule } from '@nestjs/testing';
import { CycleMoodsService } from './cycle-moods.service';

describe('CycleMoodsService', () => {
  let service: CycleMoodsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CycleMoodsService],
    }).compile();

    service = module.get<CycleMoodsService>(CycleMoodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
