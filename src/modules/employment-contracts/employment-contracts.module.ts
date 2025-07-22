import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from 'src/constant';
import { ContractFilesModule } from '../contract-files/contract-files.module';
import { FilesModule } from '../files/files.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { EmploymentContractJobsService } from './employment-contracts-jobs.service';
import { EmploymentContractsController } from './employment-contracts.controller';
import { EmploymentContractsService } from './employment-contracts.service';
import { EmploymentContract } from './entities/employment-contract.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([EmploymentContract, User]),
        FilesModule,
        ContractFilesModule,
        NotificationsModule,
        BullModule.registerQueue({
            name: QUEUE_NAMES.NOTIFICATION_QUEUE,
        }),
    ],
    controllers: [EmploymentContractsController],
    providers: [EmploymentContractsService, EmploymentContractJobsService],
    exports: [EmploymentContractsService],
})
export class EmploymentContractsModule {}
