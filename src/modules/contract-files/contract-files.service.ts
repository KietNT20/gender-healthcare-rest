import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../documents/entities/document.entity';
import { EmploymentContract } from '../employment-contracts/entities/employment-contract.entity';
import { CreateContractFileDto } from './dto/create-contract-file.dto';
import { UpdateContractFileDto } from './dto/update-contract-file.dto';
import { ContractFile } from './entities/contract-file.entity';

@Injectable()
export class ContractFilesService {
    constructor(
        @InjectRepository(ContractFile)
        private readonly contractFileRepository: Repository<ContractFile>,
        @InjectRepository(EmploymentContract)
        private readonly contractRepository: Repository<EmploymentContract>,
        @InjectRepository(Document)
        private readonly documentRepository: Repository<Document>,
    ) {}

    async create(createDto: CreateContractFileDto): Promise<ContractFile> {
        const contract = await this.contractRepository.findOneBy({
            id: createDto.contractId,
        });
        if (!contract) {
            throw new NotFoundException(
                `Contract with ID ${createDto.contractId} not found.`,
            );
        }

        const file = await this.documentRepository.findOneBy({
            id: createDto.fileId,
        });
        if (!file) {
            throw new NotFoundException(
                `Document with ID ${createDto.fileId} not found.`,
            );
        }

        const contractFile = this.contractFileRepository.create({
            contract: contract,
            file: file,
            fileType: createDto.fileType,
        });

        return this.contractFileRepository.save(contractFile);
    }

    async update(
        id: string,
        updateDto: UpdateContractFileDto,
    ): Promise<ContractFile> {
        const contractFileLink = await this.contractFileRepository.findOneBy({
            id,
        });

        if (!contractFileLink) {
            throw new NotFoundException(
                `Contract file link with ID ${id} not found.`,
            );
        }

        this.contractFileRepository.merge(contractFileLink, updateDto);
        return this.contractFileRepository.save(contractFileLink);
    }

    async remove(id: string): Promise<void> {
        const result = await this.contractFileRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(
                `Contract file link with ID ${id} not found.`,
            );
        }
    }
}
