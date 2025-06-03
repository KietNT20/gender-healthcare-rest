import { Test, TestingModule } from '@nestjs/testing';
import { MenstrualCyclesService } from './menstrual-cycles.service';

describe('MenstrualCyclesService', () => {
  let service: MenstrualCyclesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenstrualCyclesService],
    }).compile();

    service = module.get<MenstrualCyclesService>(MenstrualCyclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
