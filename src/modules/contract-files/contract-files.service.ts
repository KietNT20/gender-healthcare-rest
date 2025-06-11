import { Injectable } from '@nestjs/common';
import { CreateContractFileDto } from './dto/create-contract-file.dto';
import { UpdateContractFileDto } from './dto/update-contract-file.dto';

@Injectable()
export class ContractFilesService {
  create(createContractFileDto: CreateContractFileDto) {
    return 'This action adds a new contractFile';
  }

  findAll() {
    return `This action returns all contractFiles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contractFile`;
  }

  update(id: number, updateContractFileDto: UpdateContractFileDto) {
    return `This action updates a #${id} contractFile`;
  }

  remove(id: number) {
    return `This action removes a #${id} contractFile`;
  }
}
