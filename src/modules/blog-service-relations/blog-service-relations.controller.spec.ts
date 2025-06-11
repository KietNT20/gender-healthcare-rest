import { Test, TestingModule } from '@nestjs/testing';
import { BlogServiceRelationsController } from './blog-service-relations.controller';
import { BlogServiceRelationsService } from './blog-service-relations.service';

describe('BlogServiceRelationsController', () => {
    let controller: BlogServiceRelationsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlogServiceRelationsController],
            providers: [BlogServiceRelationsService],
        }).compile();

        controller = module.get<BlogServiceRelationsController>(
            BlogServiceRelationsController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
