import { Test, TestingModule } from '@nestjs/testing';
import { ContractFilesService } from './contract-files.service';

describe('ContractFilesService', () => {
    let service: ContractFilesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ContractFilesService],
        }).compile();

        service = module.get<ContractFilesService>(ContractFilesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
