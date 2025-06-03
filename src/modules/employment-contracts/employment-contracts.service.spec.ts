import { Test, TestingModule } from '@nestjs/testing';
import { EmploymentContractsService } from './employment-contracts.service';

describe('EmploymentContractsService', () => {
  let service: EmploymentContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmploymentContractsService],
    }).compile();

    service = module.get<EmploymentContractsService>(EmploymentContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
