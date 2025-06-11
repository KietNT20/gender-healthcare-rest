import { Module } from '@nestjs/common';
import { TestResultsService } from './test-results.service';
import { TestResultsController } from './test-results.controller';

@Module({
  controllers: [TestResultsController],
  providers: [TestResultsService],
})
export class TestResultsModule {}
