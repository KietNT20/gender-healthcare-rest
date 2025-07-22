import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContractStatusType } from 'src/enums';
import { Repository } from 'typeorm';
import { ContractFilesService } from '../contract-files/contract-files.service';
import { FilesService } from '../files/files.service';
import { User } from '../users/entities/user.entity';
import { CreateEmploymentContractDto } from './dto/create-employment-contract.dto';
import { RenewEmploymentContractDto } from './dto/renew-employment-contract.dto';
import { UpdateEmploymentContractDto } from './dto/update-employment-contract.dto';
import { EmploymentContract } from './entities/employment-contract.entity';

@Injectable()
export class EmploymentContractsService {
    constructor(
        @InjectRepository(EmploymentContract)
        private readonly employmentContractRepository: Repository<EmploymentContract>,
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

        const contract = this.employmentContractRepository.create({
            ...createDto,
            user,
        });
        return this.employmentContractRepository.save(contract);
    }

    async findAll(): Promise<EmploymentContract[]> {
        return this.employmentContractRepository.find({
            relations: {
                user: true,
                contractFiles: {
                    file: true,
                },
            },
        });
    }

    async findOne(id: string): Promise<EmploymentContract> {
        const contract = await this.employmentContractRepository.findOne({
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
        this.employmentContractRepository.merge(contract, updateDto);
        return this.employmentContractRepository.save(contract);
    }

    async remove(id: string): Promise<void> {
        const result = await this.employmentContractRepository.softDelete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Contract with ID ${id} not found.`);
        }
    }

    async attachFile(
        contractId: string,
        file: Express.Multer.File,
        fileType: string = 'contract',
    ): Promise<EmploymentContract> {
        const contract = await this.findOne(contractId);

        // Step 1: Upload the file using FilesService. It will be private by default.
        const uploadedDocument = await this.filesService.uploadDocument({
            file,
            entityType: 'employment_contract',
            entityId: contractId,
            description: `Contract file for ${contract.contractNumber}`,
            isSensitive: true,
            documentType: fileType,
        });

        // Step 2: Create the link using ContractFilesService.
        await this.contractFilesService.create({
            contractId: contract.id,
            fileId: uploadedDocument.id,
            fileType: fileType,
        });

        // Step 3: Return the updated contract with the new file included.
        return this.findOne(contractId);
    }

    async renew(
        oldContractId: string,
        renewalData: RenewEmploymentContractDto,
        file: Express.Multer.File,
    ): Promise<EmploymentContract> {
        const oldContract = await this.findOne(oldContractId);
        oldContract.status = ContractStatusType.RENEWED;
        await this.employmentContractRepository.save(oldContract);

        const newContract = this.employmentContractRepository.create({
            ...oldContract,
            id: undefined,
            contractNumber: oldContract.contractNumber,
            startDate: renewalData.startDate,
            endDate: renewalData.endDate,
            status: ContractStatusType.ACTIVE,
            contractFiles: [],
        });
        const savedNewContract =
            await this.employmentContractRepository.save(newContract);

        return this.attachFile(savedNewContract.id, file, 'contract');
    }

    async terminate(id: string): Promise<EmploymentContract> {
        const contract = await this.findOne(id);
        contract.status = ContractStatusType.TERMINATED;
        return this.employmentContractRepository.save(contract);
    }
}
