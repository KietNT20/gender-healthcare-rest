import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
    constructor(
        @InjectRepository(Document)
        private readonly documentRepository: Repository<Document>,
        private readonly filesService: FilesService,
    ) {}

    async findOne(id: string): Promise<Document> {
        const document = await this.documentRepository.findOneBy({ id });
        if (!document) {
            throw new NotFoundException(`Document with ID ${id} not found`);
        }
        return document;
    }

    async update(
        id: string,
        updateDocumentDto: UpdateDocumentDto,
    ): Promise<Document> {
        const document = await this.findOne(id);
        this.documentRepository.merge(document, updateDocumentDto);
        return this.documentRepository.save(document);
    }

    async getSecureUrl(
        id: string,
    ): Promise<{ url: string; originalName: string }> {
        const docWithUrl = await this.filesService.getDocumentWithAccessUrl(id);
        return {
            url: docWithUrl.accessUrl,
            originalName: docWithUrl.originalName,
        };
    }

    async remove(id: string): Promise<void> {
        await this.filesService.deleteDocument(id);
    }

    async findByEntity(
        entityType: string,
        entityId: string,
    ): Promise<Document[]> {
        return this.filesService.getDocumentsByEntity(entityType, entityId);
    }
}
