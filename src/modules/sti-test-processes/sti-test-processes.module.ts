import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsModule } from '../appointments/appointments.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TestResultsModule } from '../test-results/test-results.module';
import { UsersModule } from '../users/users.module';
import { StiTestProcess } from './entities/sti-test-process.entity';
import { StiTestProcessesController } from './sti-test-processes.controller';
import { StiTestProcessesService } from './sti-test-processes.service';
import { StiTestWorkflowService } from './workflow/sti-test-workflow.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([StiTestProcess]),
        TestResultsModule,
        AppointmentsModule,
        NotificationsModule,
        MailModule,
        UsersModule,
    ],
    controllers: [StiTestProcessesController],
    providers: [StiTestProcessesService, StiTestWorkflowService],
    exports: [StiTestProcessesService, StiTestWorkflowService],
})
export class StiTestProcessesModule {}
