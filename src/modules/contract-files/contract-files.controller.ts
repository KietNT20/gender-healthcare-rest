import {
    Body,
    Controller,
    Delete,
    Param,
    ParseUUIDPipe,
    Patch,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContractFilesService } from './contract-files.service';
import { UpdateContractFileDto } from './dto/update-contract-file.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contract-files')
export class ContractFilesController {
    constructor(private readonly contractFilesService: ContractFilesService) {}

    @Patch(':id')
    @ApiOperation({
        summary: 'Update the metadata of a contract file link (e.g., fileType)',
    })
    @ResponseMessage('Contract file link updated successfully.')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateContractFileDto,
    ) {
        return this.contractFilesService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Unlink a file from a contract (does not delete the file)',
    })
    @ResponseMessage('File unlinked successfully.')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.contractFilesService.remove(id);
    }
}
