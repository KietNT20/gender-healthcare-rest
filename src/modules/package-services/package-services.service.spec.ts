import { Test, TestingModule } from '@nestjs/testing';
import { PackageServicesService } from './package-services.service';

describe('PackageServicesService', () => {
  let service: PackageServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PackageServicesService],
    }).compile();

    service = module.get<PackageServicesService>(PackageServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
