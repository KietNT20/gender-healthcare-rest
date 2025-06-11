import { Test, TestingModule } from '@nestjs/testing';
import { TestResultsService } from './test-results.service';

describe('TestResultsService', () => {
  let service: TestResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestResultsService],
    }).compile();

    service = module.get<TestResultsService>(TestResultsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
