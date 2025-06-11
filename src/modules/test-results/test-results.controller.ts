import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TestResultsService } from './test-results.service';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { UpdateTestResultDto } from './dto/update-test-result.dto';

@Controller('test-results')
export class TestResultsController {
  constructor(private readonly testResultsService: TestResultsService) {}

  @Post()
  create(@Body() createTestResultDto: CreateTestResultDto) {
    return this.testResultsService.create(createTestResultDto);
  }

  @Get()
  findAll() {
    return this.testResultsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testResultsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestResultDto: UpdateTestResultDto) {
    return this.testResultsService.update(+id, updateTestResultDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testResultsService.remove(+id);
  }
}
