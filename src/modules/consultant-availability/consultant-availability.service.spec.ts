import { Test, TestingModule } from '@nestjs/testing';
import { ConsultantAvailabilityService } from './consultant-availability.service';

describe('ConsultantAvailabilityService', () => {
  let service: ConsultantAvailabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultantAvailabilityService],
    }).compile();

    service = module.get<ConsultantAvailabilityService>(ConsultantAvailabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
