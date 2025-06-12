import { Module } from '@nestjs/common';
import { BlogServiceRelationsService } from './blog-service-relations.service';
import { BlogServiceRelationsController } from './blog-service-relations.controller';

@Module({
    controllers: [BlogServiceRelationsController],
    providers: [BlogServiceRelationsService],
})
export class BlogServiceRelationsModule {}
