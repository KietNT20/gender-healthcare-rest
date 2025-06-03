import { Test, TestingModule } from '@nestjs/testing';
import { TestResultsController } from './test-results.controller';
import { TestResultsService } from './test-results.service';

describe('TestResultsController', () => {
  let controller: TestResultsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestResultsController],
      providers: [TestResultsService],
    }).compile();

    controller = module.get<TestResultsController>(TestResultsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
