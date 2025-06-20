import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../documents/entities/document.entity';
import { EmploymentContract } from '../employment-contracts/entities/employment-contract.entity';
import { ContractFilesController } from './contract-files.controller';
import { ContractFilesService } from './contract-files.service';
import { ContractFile } from './entities/contract-file.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ContractFile, EmploymentContract, Document]),
    ],
    controllers: [ContractFilesController],
    providers: [ContractFilesService],
    exports: [ContractFilesService],
})
export class ContractFilesModule {}
