import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { UpdateDocumentDto } from './dto/update-document.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) {}

    @Get('entity/:entityType/:entityId')
    @ApiOperation({ summary: 'Get all documents for a specific entity' })
    @ResponseMessage('Documents for entity retrieved successfully.')
    findByEntity(
        @Param('entityType') entityType: string,
        @Param('entityId', ParseUUIDPipe) entityId: string,
    ) {
        return this.documentsService.findByEntity(entityType, entityId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get document metadata by ID' })
    @ResponseMessage('Document metadata retrieved successfully.')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.documentsService.findOne(id);
    }

    @Get(':id/access-url')
    @ApiOperation({ summary: 'Get a secure, temporary URL for a document' })
    @ResponseMessage('Document access URL generated successfully.')
    getAccessUrl(@Param('id', ParseUUIDPipe) id: string) {
        return this.documentsService.getSecureUrl(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update document metadata' })
    @ResponseMessage('Document metadata updated successfully.')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDocumentDto: UpdateDocumentDto,
    ) {
        return this.documentsService.update(id, updateDocumentDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a document and its file from storage' })
    @ResponseMessage('Document deleted successfully.')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.documentsService.remove(id);
    }
}
