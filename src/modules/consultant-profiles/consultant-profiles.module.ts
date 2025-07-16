import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from 'src/constant';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { ConsultantAvailability } from '../consultant-availability/entities/consultant-availability.entity';
import { Document } from '../documents/entities/document.entity';
import { FilesModule } from '../files/files.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { ConsultantProfilesController } from './consultant-profiles.controller';
import { ConsultantProfilesService } from './consultant-profiles.service';
import { ConsultantRegistrationNotificationProcessor } from './consultant-registration/consultant-registration.processor';
import { ConsultantRegistrationService } from './consultant-registration/consultant-registration.service';
import { ConsultantScheduleCronService } from './consultant-schedule-cron.service';
import { ConsultantScheduleGeneratorService } from './consultant-schedule-generator.service';
import { ConsultantProfile } from './entities/consultant-profile.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ConsultantProfile,
            User,
            Role,
            Document,
            ConsultantAvailability,
        ]),
        AuthModule,
        AuditLogsModule,
        FilesModule,
        MailModule,
        NotificationsModule,
        BullModule.registerQueue({
            name: QUEUE_NAMES.CONSULTANT_REGISTRATION_NOTIFICATION,
        }),
    ],
    controllers: [ConsultantProfilesController],
    providers: [
        ConsultantProfilesService,
        ConsultantRegistrationService,
        ConsultantScheduleGeneratorService,
        ConsultantScheduleCronService,
        ConsultantRegistrationNotificationProcessor,
    ],
    exports: [ConsultantProfilesService, ConsultantScheduleGeneratorService],
})
export class ConsultantProfilesModule {}
