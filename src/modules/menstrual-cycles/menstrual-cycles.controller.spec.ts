import { Test, TestingModule } from '@nestjs/testing';
import { MenstrualCyclesController } from './menstrual-cycles.controller';
import { MenstrualCyclesService } from './menstrual-cycles.service';

describe('MenstrualCyclesController', () => {
    let controller: MenstrualCyclesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MenstrualCyclesController],
            providers: [MenstrualCyclesService],
        }).compile();

        controller = module.get<MenstrualCyclesController>(
            MenstrualCyclesController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
