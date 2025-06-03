import { Test, TestingModule } from '@nestjs/testing';
import { BlogServiceRelationsService } from './blog-service-relations.service';

describe('BlogServiceRelationsService', () => {
  let service: BlogServiceRelationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlogServiceRelationsService],
    }).compile();

    service = module.get<BlogServiceRelationsService>(BlogServiceRelationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
