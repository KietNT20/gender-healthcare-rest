import { Test, TestingModule } from '@nestjs/testing';
import { CycleSymptomsService } from './cycle-symptoms.service';

describe('CycleSymptomsService', () => {
    let service: CycleSymptomsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CycleSymptomsService],
        }).compile();

        service = module.get<CycleSymptomsService>(CycleSymptomsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
