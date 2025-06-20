import { Test, TestingModule } from '@nestjs/testing';
import { ConsultantRegistrationService } from './consultant-registration.service';

describe('ConsultantRegistrationService', () => {
  let service: ConsultantRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultantRegistrationService],
    }).compile();

    service = module.get<ConsultantRegistrationService>(ConsultantRegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
