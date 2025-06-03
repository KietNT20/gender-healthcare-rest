import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentServicesController } from './appointment-services.controller';
import { AppointmentServicesService } from './appointment-services.service';

describe('AppointmentServicesController', () => {
  let controller: AppointmentServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentServicesController],
      providers: [AppointmentServicesService],
    }).compile();

    controller = module.get<AppointmentServicesController>(AppointmentServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
