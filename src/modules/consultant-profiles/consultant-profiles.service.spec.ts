import { Test, TestingModule } from '@nestjs/testing';
import { ConsultantProfilesService } from './consultant-profiles.service';

describe('ConsultantProfilesService', () => {
    let service: ConsultantProfilesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConsultantProfilesService],
        }).compile();

        service = module.get<ConsultantProfilesService>(
            ConsultantProfilesService,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
