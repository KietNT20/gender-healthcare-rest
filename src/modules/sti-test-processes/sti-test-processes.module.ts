import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from 'src/constant';
import { AppointmentsModule } from '../appointments/appointments.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PackageService } from '../package-services/entities/package-service.entity';
import { Service } from '../services/entities/service.entity';
import { ServicesModule } from '../services/services.module';
import { TestResultsModule } from '../test-results/test-results.module';
import { UsersModule } from '../users/users.module';
import { StiTestProcess } from './entities/sti-test-process.entity';
import { StiTestIntegrationService } from './sti-test-integration.service';
import { StiTestProcessesController } from './sti-test-processes.controller';
import { StiTestProcessNotificationProcessor } from './sti-test-processes.processor';
import { StiTestProcessesService } from './sti-test-processes.service';
import { StiTestWorkflowService } from './workflow/sti-test-workflow.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([StiTestProcess, Service, PackageService]),
        TestResultsModule,
        NotificationsModule,
        MailModule,
        UsersModule,
        ServicesModule,
        AppointmentsModule,
        BullModule.registerQueue({
            name: QUEUE_NAMES.STI_TEST_PROCESS_NOTIFICATION,
        }),
    ],
    controllers: [StiTestProcessesController],
    providers: [
        StiTestProcessesService,
        StiTestWorkflowService,
        StiTestIntegrationService,
        StiTestProcessNotificationProcessor,
    ],
    exports: [
        StiTestProcessesService,
        StiTestWorkflowService,
        StiTestIntegrationService,
    ],
})
export class StiTestProcessesModule {}
