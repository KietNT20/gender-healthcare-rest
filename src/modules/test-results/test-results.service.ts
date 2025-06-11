import { Injectable } from '@nestjs/common';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { UpdateTestResultDto } from './dto/update-test-result.dto';

@Injectable()
export class TestResultsService {
  create(createTestResultDto: CreateTestResultDto) {
    return 'This action adds a new testResult';
  }

  findAll() {
    return `This action returns all testResults`;
  }

  findOne(id: number) {
    return `This action returns a #${id} testResult`;
  }

  update(id: number, updateTestResultDto: UpdateTestResultDto) {
    return `This action updates a #${id} testResult`;
  }

  remove(id: number) {
    return `This action removes a #${id} testResult`;
  }
}
