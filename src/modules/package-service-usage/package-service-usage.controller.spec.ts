import { Test, TestingModule } from '@nestjs/testing';
import { PackageServiceUsageController } from './package-service-usage.controller';
import { PackageServiceUsageService } from './package-service-usage.service';

describe('PackageServiceUsageController', () => {
    let controller: PackageServiceUsageController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PackageServiceUsageController],
            providers: [PackageServiceUsageService],
        }).compile();

        controller = module.get<PackageServiceUsageController>(
            PackageServiceUsageController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
