import { Test, TestingModule } from '@nestjs/testing';
import { CycleSymptomsController } from './cycle-symptoms.controller';
import { CycleSymptomsService } from './cycle-symptoms.service';

describe('CycleSymptomsController', () => {
    let controller: CycleSymptomsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CycleSymptomsController],
            providers: [CycleSymptomsService],
        }).compile();

        controller = module.get<CycleSymptomsController>(
            CycleSymptomsController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
