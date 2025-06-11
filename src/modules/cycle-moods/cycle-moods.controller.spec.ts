import { Test, TestingModule } from '@nestjs/testing';
import { CycleMoodsController } from './cycle-moods.controller';
import { CycleMoodsService } from './cycle-moods.service';

describe('CycleMoodsController', () => {
    let controller: CycleMoodsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CycleMoodsController],
            providers: [CycleMoodsService],
        }).compile();

        controller = module.get<CycleMoodsController>(CycleMoodsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
