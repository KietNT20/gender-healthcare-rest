import { Module } from '@nestjs/common';
import { QuestionTagsService } from './question-tags.service';
import { QuestionTagsController } from './question-tags.controller';

@Module({
  controllers: [QuestionTagsController],
  providers: [QuestionTagsService],
})
export class QuestionTagsModule {}
