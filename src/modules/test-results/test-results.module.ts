import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Document } from '../documents/entities/document.entity';
import { FilesModule } from '../files/files.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { TestResult } from './entities/test-result.entity';
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
    providers: [TestResultsService],
    exports: [TestResultsService],
})
export class TestResultsModule {}
