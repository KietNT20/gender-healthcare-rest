import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentServicesService } from './appointment-services.service';

describe('AppointmentServicesService', () => {
  let service: AppointmentServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppointmentServicesService],
    }).compile();

    service = module.get<AppointmentServicesService>(AppointmentServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
