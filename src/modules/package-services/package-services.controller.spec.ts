import { Test, TestingModule } from '@nestjs/testing';
import { PackageServicesController } from './package-services.controller';
import { PackageServicesService } from './package-services.service';

describe('PackageServicesController', () => {
  let controller: PackageServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackageServicesController],
      providers: [PackageServicesService],
    }).compile();

    controller = module.get<PackageServicesController>(PackageServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
