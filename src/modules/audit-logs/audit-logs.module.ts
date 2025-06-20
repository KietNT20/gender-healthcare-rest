import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog } from './entities/audit-log.entity';

@Module({
    imports: [TypeOrmModule.forFeature([AuditLog, User])],
    controllers: [AuditLogsController],
    providers: [AuditLogsService],
    exports: [AuditLogsService],
})
export class AuditLogsModule {}
