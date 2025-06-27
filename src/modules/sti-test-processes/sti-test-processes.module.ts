import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PackageService } from '../package-services/entities/package-service.entity';
import { Service } from '../services/entities/service.entity';
import { TestResultsModule } from '../test-results/test-results.module';
import { UsersModule } from '../users/users.module';
import { StiTestProcess } from './entities/sti-test-process.entity';
import { StiTestIntegrationService } from './sti-test-integration.service';
import { StiTestProcessesController } from './sti-test-processes.controller';
import { StiTestProcessesService } from './sti-test-processes.service';
import { StiTestWorkflowService } from './workflow/sti-test-workflow.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([StiTestProcess, Service, PackageService]),
        TestResultsModule,
        NotificationsModule,
        MailModule,
        UsersModule,
    ],
    controllers: [StiTestProcessesController],
    providers: [
        StiTestProcessesService,
        StiTestWorkflowService,
        StiTestIntegrationService,
    ],
    exports: [
        StiTestProcessesService,
        StiTestWorkflowService,
        StiTestIntegrationService,
    ],
})
export class StiTestProcessesModule {}
