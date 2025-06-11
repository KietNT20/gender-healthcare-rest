import { Test, TestingModule } from '@nestjs/testing';
import { ContractFilesController } from './contract-files.controller';
import { ContractFilesService } from './contract-files.service';

describe('ContractFilesController', () => {
    let controller: ContractFilesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ContractFilesController],
            providers: [ContractFilesService],
        }).compile();

        controller = module.get<ContractFilesController>(
            ContractFilesController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
