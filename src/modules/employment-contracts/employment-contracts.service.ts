import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractFilesService } from '../contract-files/contract-files.service';
import { FilesService } from '../files/files.service';
import { User } from '../users/entities/user.entity';
import { CreateEmploymentContractDto } from './dto/create-employment-contract.dto';
import { UpdateEmploymentContractDto } from './dto/update-employment-contract.dto';
import { EmploymentContract } from './entities/employment-contract.entity';

@Injectable()
export class EmploymentContractsService {
    constructor(
        @InjectRepository(EmploymentContract)
        private readonly contractRepository: Repository<EmploymentContract>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly filesService: FilesService,
        private readonly contractFilesService: ContractFilesService,
    ) {}

    async create(
        createDto: CreateEmploymentContractDto,
    ): Promise<EmploymentContract> {
        const user = await this.userRepository.findOneBy({
            id: createDto.userId,
        });
        if (!user) {
            throw new NotFoundException(
                `User with ID ${createDto.userId} not found.`,
            );
        }

        const contract = this.contractRepository.create({
            ...createDto,
            user,
        });
        return this.contractRepository.save(contract);
    }

    async findAll(): Promise<EmploymentContract[]> {
        return this.contractRepository.find({
            relations: {
                user: true,
                contractFiles: {
                    file: true,
                },
            },
        });
    }

    async findOne(id: string): Promise<EmploymentContract> {
        const contract = await this.contractRepository.findOne({
            where: { id },
            relations: {
                user: true,
                contractFiles: {
                    file: true,
                },
            },
        });
        if (!contract) {
            throw new NotFoundException(`Contract with ID ${id} not found.`);
        }
        return contract;
    }

    async update(
        id: string,
        updateDto: UpdateEmploymentContractDto,
    ): Promise<EmploymentContract> {
        const contract = await this.findOne(id);
        this.contractRepository.merge(contract, updateDto);
        return this.contractRepository.save(contract);
    }

    async remove(id: string): Promise<void> {
        const contract = await this.findOne(id);
        // Note: This only soft-deletes the contract, not the associated files.
        // You might want to add logic to delete files if needed.
        await this.contractRepository.softDelete(id);
    }

    async attachFile(
        contractId: string,
        file: Express.Multer.File,
        fileType?: string,
    ): Promise<EmploymentContract> {
        const contract = await this.findOne(contractId);

        // Step 1: Upload the file using FilesService. It will be private by default.
        const uploadedDocument = await this.filesService.uploadDocument({
            file,
            entityType: 'employment-contract',
            entityId: contractId,
            description: `Contract file for ${contract.contractNumber}`,
            isSensitive: true,
            documentType: fileType,
        });

        // Step 2: Create the link using ContractFilesService.
        this.contractFilesService.create({
            contractId: contract.id,
            fileId: uploadedDocument.id,
            fileType: fileType,
        });

        // Step 3: Return the updated contract with the new file included.
        return this.findOne(contractId);
    }
}
