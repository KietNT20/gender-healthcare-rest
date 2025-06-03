import { Test, TestingModule } from '@nestjs/testing';
import { UserPackageSubscriptionsController } from './user-package-subscriptions.controller';
import { UserPackageSubscriptionsService } from './user-package-subscriptions.service';

describe('UserPackageSubscriptionsController', () => {
  let controller: UserPackageSubscriptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPackageSubscriptionsController],
      providers: [UserPackageSubscriptionsService],
    }).compile();

    controller = module.get<UserPackageSubscriptionsController>(UserPackageSubscriptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
