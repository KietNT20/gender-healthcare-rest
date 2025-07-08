import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Document } from '../documents/entities/document.entity';
import { FilesModule } from '../files/files.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StiTestProcess } from '../sti-test-processes/entities/sti-test-process.entity';
import { User } from '../users/entities/user.entity';
import { TestResult } from './entities/test-result.entity';
import { TestResultExportPdfService } from './services/test-result-export-pdf.service';
import { TestResultMapperService } from './services/test-result-mapper.service';
import { TestResultTemplateService } from './services/test-result-template.service';
import { TestResultsController } from './test-results.controller';
import { TestResultsService } from './test-results.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TestResult,
            Appointment,
            User,
            Document,
            StiTestProcess,
        ]),
        FilesModule,
        NotificationsModule,
        MailModule,
    ],
    controllers: [TestResultsController],
    providers: [
        TestResultsService,
        TestResultTemplateService,
        TestResultMapperService,
        TestResultExportPdfService,
    ],
    exports: [
        TestResultsService,
        TestResultTemplateService,
        TestResultMapperService,
        TestResultExportPdfService,
    ],
})
export class TestResultsModule {}
