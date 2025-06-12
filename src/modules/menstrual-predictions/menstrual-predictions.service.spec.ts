import { Test, TestingModule } from '@nestjs/testing';
import { MenstrualPredictionsService } from './menstrual-predictions.service';

describe('MenstrualPredictionsService', () => {
    let service: MenstrualPredictionsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [MenstrualPredictionsService],
        }).compile();

        service = module.get<MenstrualPredictionsService>(
            MenstrualPredictionsService,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
