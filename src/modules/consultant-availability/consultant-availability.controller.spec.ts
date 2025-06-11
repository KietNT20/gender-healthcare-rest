import { Test, TestingModule } from '@nestjs/testing';
import { ConsultantAvailabilityController } from './consultant-availability.controller';
import { ConsultantAvailabilityService } from './consultant-availability.service';

describe('ConsultantAvailabilityController', () => {
  let controller: ConsultantAvailabilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultantAvailabilityController],
      providers: [ConsultantAvailabilityService],
    }).compile();

    controller = module.get<ConsultantAvailabilityController>(ConsultantAvailabilityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
