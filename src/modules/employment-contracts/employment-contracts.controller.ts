import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEmploymentContractDto } from './dto/create-employment-contract.dto';
import {
    RenewEmploymentContractBodyDto,
    RenewEmploymentContractDto,
} from './dto/renew-employment-contract.dto';
import { UpdateEmploymentContractDto } from './dto/update-employment-contract.dto';
import { EmploymentContractsService } from './employment-contracts.service';

@ApiTags('Employment Contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employment-contracts')
export class EmploymentContractsController {
    constructor(
        private readonly employmentContractsService: EmploymentContractsService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new employment contract' })
    @ResponseMessage('Contract created successfully.')
    create(@Body() createEmploymentContractDto: CreateEmploymentContractDto) {
        return this.employmentContractsService.create(
            createEmploymentContractDto,
        );
    }

    @Get()
    @ApiOperation({ summary: 'Get all employment contracts' })
    @ResponseMessage('Contracts retrieved successfully.')
    findAll() {
        return this.employmentContractsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single contract by ID' })
    @ResponseMessage('Contract retrieved successfully.')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.employmentContractsService.findOne(id);
    }

    @Post(':id/attach-file')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Attach a file to an employment contract' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                fileType: { type: 'string', example: 'contract' },
            },
        },
    })
    @ResponseMessage('File attached successfully.')
    attachFile(
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body('fileType') fileType: string = 'contract',
    ) {
        return this.employmentContractsService.attachFile(id, file, fileType);
    }

    @Post(':id/renew')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Renew an employment contract and upload the new document',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        type: RenewEmploymentContractBodyDto,
    })
    @ApiOkResponse({
        description: 'The newly created and renewed contract object.',
    })
    renew(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() renewalData: RenewEmploymentContractDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.employmentContractsService.renew(id, renewalData, file);
    }

    @Patch(':id/terminate')
    @ApiOperation({ summary: 'Terminate an employment contract' })
    @ApiOkResponse({
        description: 'The employment contract has been terminated.',
    })
    @ResponseMessage('Contract terminated successfully.')
    terminate(@Param('id', ParseUUIDPipe) id: string) {
        return this.employmentContractsService.terminate(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a contract' })
    @ResponseMessage('Contract updated successfully.')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateEmploymentContractDto: UpdateEmploymentContractDto,
    ) {
        return this.employmentContractsService.update(
            id,
            updateEmploymentContractDto,
        );
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a contract' })
    @ResponseMessage('Contract deleted successfully.')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.employmentContractsService.remove(id);
    }
}
