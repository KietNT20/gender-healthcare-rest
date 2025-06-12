import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { EmploymentContractsService } from './employment-contracts.service';
import { CreateEmploymentContractDto } from './dto/create-employment-contract.dto';
import { UpdateEmploymentContractDto } from './dto/update-employment-contract.dto';

@Controller('employment-contracts')
export class EmploymentContractsController {
    constructor(
        private readonly employmentContractsService: EmploymentContractsService,
    ) {}

    @Post()
    create(@Body() createEmploymentContractDto: CreateEmploymentContractDto) {
        return this.employmentContractsService.create(
            createEmploymentContractDto,
        );
    }

    @Get()
    findAll() {
        return this.employmentContractsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.employmentContractsService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateEmploymentContractDto: UpdateEmploymentContractDto,
    ) {
        return this.employmentContractsService.update(
            +id,
            updateEmploymentContractDto,
        );
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.employmentContractsService.remove(+id);
    }
}
