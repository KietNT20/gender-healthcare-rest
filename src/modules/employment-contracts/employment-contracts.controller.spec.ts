import { Test, TestingModule } from '@nestjs/testing';
import { EmploymentContractsController } from './employment-contracts.controller';
import { EmploymentContractsService } from './employment-contracts.service';

describe('EmploymentContractsController', () => {
  let controller: EmploymentContractsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmploymentContractsController],
      providers: [EmploymentContractsService],
    }).compile();

    controller = module.get<EmploymentContractsController>(EmploymentContractsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
