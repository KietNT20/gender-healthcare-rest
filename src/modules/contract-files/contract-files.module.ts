import { Module } from '@nestjs/common';
import { ContractFilesService } from './contract-files.service';
import { ContractFilesController } from './contract-files.controller';

@Module({
    controllers: [ContractFilesController],
    providers: [ContractFilesService],
})
export class ContractFilesModule {}
