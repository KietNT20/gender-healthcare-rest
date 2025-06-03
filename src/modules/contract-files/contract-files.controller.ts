import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ContractFilesService } from './contract-files.service';
import { CreateContractFileDto } from './dto/create-contract-file.dto';
import { UpdateContractFileDto } from './dto/update-contract-file.dto';

@Controller('contract-files')
export class ContractFilesController {
  constructor(private readonly contractFilesService: ContractFilesService) {}

  @Post()
  create(@Body() createContractFileDto: CreateContractFileDto) {
    return this.contractFilesService.create(createContractFileDto);
  }

  @Get()
  findAll() {
    return this.contractFilesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractFilesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContractFileDto: UpdateContractFileDto) {
    return this.contractFilesService.update(+id, updateContractFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractFilesService.remove(+id);
  }
}
