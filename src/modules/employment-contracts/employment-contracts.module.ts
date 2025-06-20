import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractFilesModule } from '../contract-files/contract-files.module';
import { FilesModule } from '../files/files.module';
import { User } from '../users/entities/user.entity';
import { EmploymentContractsController } from './employment-contracts.controller';
import { EmploymentContractsService } from './employment-contracts.service';
import { EmploymentContract } from './entities/employment-contract.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([EmploymentContract, User]),
        FilesModule,
        ContractFilesModule,
    ],
    controllers: [EmploymentContractsController],
    providers: [EmploymentContractsService],
    exports: [EmploymentContractsService],
})
export class EmploymentContractsModule {}
