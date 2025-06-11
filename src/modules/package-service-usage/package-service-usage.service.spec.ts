import { Test, TestingModule } from '@nestjs/testing';
import { PackageServiceUsageService } from './package-service-usage.service';

describe('PackageServiceUsageService', () => {
  let service: PackageServiceUsageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PackageServiceUsageService],
    }).compile();

    service = module.get<PackageServiceUsageService>(PackageServiceUsageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
