import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Document } from '../documents/entities/document.entity';
import { FilesModule } from '../files/files.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { TestResult } from './entities/test-result.entity';
import { TestResultMapperService } from './services/test-result-mapper.service';
import { TestResultTemplateService } from './services/test-result-template.service';
import { TestResultsController } from './test-results.controller';
import { TestResultsService } from './test-results.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([TestResult, Appointment, User, Document]),
        FilesModule,
        NotificationsModule,
        MailModule,
    ],
    controllers: [TestResultsController],
    providers: [
        TestResultsService,
        TestResultTemplateService,
        TestResultMapperService,
    ],
    exports: [
        TestResultsService,
        TestResultTemplateService,
        TestResultMapperService,
    ],
})
export class TestResultsModule {}
