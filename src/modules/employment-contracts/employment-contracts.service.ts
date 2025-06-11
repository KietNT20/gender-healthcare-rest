import { Injectable } from '@nestjs/common';
import { CreateEmploymentContractDto } from './dto/create-employment-contract.dto';
import { UpdateEmploymentContractDto } from './dto/update-employment-contract.dto';

@Injectable()
export class EmploymentContractsService {
  create(createEmploymentContractDto: CreateEmploymentContractDto) {
    return 'This action adds a new employmentContract';
  }

  findAll() {
    return `This action returns all employmentContracts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} employmentContract`;
  }

  update(id: number, updateEmploymentContractDto: UpdateEmploymentContractDto) {
    return `This action updates a #${id} employmentContract`;
  }

  remove(id: number) {
    return `This action removes a #${id} employmentContract`;
  }
}
