import { Test, TestingModule } from '@nestjs/testing';
import { MenstrualPredictionsController } from './menstrual-predictions.controller';
import { MenstrualPredictionsService } from './menstrual-predictions.service';

describe('MenstrualPredictionsController', () => {
    let controller: MenstrualPredictionsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MenstrualPredictionsController],
            providers: [MenstrualPredictionsService],
        }).compile();

        controller = module.get<MenstrualPredictionsController>(
            MenstrualPredictionsController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
