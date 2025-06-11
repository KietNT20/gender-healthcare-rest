import { Test, TestingModule } from '@nestjs/testing';
import { ConsultantProfilesController } from './consultant-profiles.controller';
import { ConsultantProfilesService } from './consultant-profiles.service';

describe('ConsultantProfilesController', () => {
    let controller: ConsultantProfilesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ConsultantProfilesController],
            providers: [ConsultantProfilesService],
        }).compile();

        controller = module.get<ConsultantProfilesController>(
            ConsultantProfilesController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
