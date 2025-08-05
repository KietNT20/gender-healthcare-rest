import { BullModule } from '@nestjs/bullmq';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import googleAuthConfig from './modules/auth/config/google-auth.config';
import { BlogsModule } from './modules/blogs/blogs.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ChatModule } from './modules/chat/chat.module';
import { ConsultantAvailabilityModule } from './modules/consultant-availability/consultant-availability.module';
import { ConsultantProfilesModule } from './modules/consultant-profiles/consultant-profiles.module';
import { ContraceptiveRemindersModule } from './modules/contraceptive-reminders/contraceptive-reminders.module';
import { ContractFilesModule } from './modules/contract-files/contract-files.module';
import { CycleSymptomsModule } from './modules/cycle-symptoms/cycle-symptoms.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EmploymentContractsModule } from './modules/employment-contracts/employment-contracts.module';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import awsConfig from './modules/files/config/aws.config';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { ImagesModule } from './modules/images/images.module';
import mailConfig from './modules/mail/config/mail.config';
import { MailModule } from './modules/mail/mail.module';
import { MenstrualCyclesModule } from './modules/menstrual-cycles/menstrual-cycles.module';
import { MenstrualPredictionsModule } from './modules/menstrual-predictions/menstrual-predictions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PackageServiceUsageModule } from './modules/package-service-usage/package-service-usage.module';
import { PackageServicesModule } from './modules/package-services/package-services.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RevenueStatsModule } from './modules/revenue-stats/revenue-stats.module';
import { RolesModule } from './modules/roles/roles.module';
import { ServicePackagesStatsModule } from './modules/service-packages-stats/service-packages-stats.module';
import { ServicePackagesModule } from './modules/service-packages/service-packages.module';
import { ServicesModule } from './modules/services/services.module';
import { StiTestProcessesModule } from './modules/sti-test-processes/sti-test-processes.module';
import { SymptomsModule } from './modules/symptoms/symptoms.module';
import { TagsModule } from './modules/tags/tags.module';
import { TestResultsModule } from './modules/test-results/test-results.module';
import { UserPackageSubscriptionsModule } from './modules/user-package-subscriptions/user-package-subscriptions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ['.env'],
            // envFilePath: ['.env.development.local'],
            isGlobal: true,
            load: [googleAuthConfig, awsConfig, mailConfig],
        }),
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    name: 'medium',
                    ttl: 10000,
                    limit: 20,
                },
                {
                    name: 'long',
                    ttl: 60000,
                    limit: 100,
                },
            ],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('DATABASE_HOST'),
                port: +configService.get('DATABASE_PORT'),
                username: configService.get('DATABASE_USER'),
                password: configService.get('DATABASE_PASSWORD'),
                database: configService.get('DATABASE_NAME'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: true,
                autoLoadEntities: true,
                // logging: true,
                dropSchema: false,
                ssl: {
                    rejectUnauthorized: true,
                    ca: readFileSync(
                        join(process.cwd(), 'certs', 'global-bundle.pem'),
                    ).toString(),
                },
                // extra: {
                //     connectionTimeoutMillis: 15000,
                //     query_timeout: 45000,
                //     statement_timeout: 45000,
                //     lock_timeout: 15000,
                //     idle_in_transaction_session_timeout: 45000,
                // },
                // pool: {
                //     max: 25,
                //     min: 5,
                //     acquireTimeoutMillis: 45000,
                //     idleTimeoutMillis: 45000,
                // },
            }),
            inject: [ConfigService],
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get('REDIS_HOST'),
                    port: +configService.get('REDIS_PORT'),
                    password: configService.get('REDIS_PASSWORD'),
                },
                tls:
                    configService.get('NODE_ENV') === 'production'
                        ? {}
                        : undefined,
                // Optimize queue performance
                defaultJobOptions: {
                    removeOnComplete: 100,
                    removeOnFail: 50,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            }),
            inject: [ConfigService],
        }),
        AppointmentsModule,
        BlogsModule,
        CategoriesModule,
        ConsultantAvailabilityModule,
        ConsultantProfilesModule,
        ContractFilesModule,
        ContraceptiveRemindersModule,
        CycleSymptomsModule,
        DocumentsModule,
        EmploymentContractsModule,
        FeedbacksModule,
        ImagesModule,
        MailModule,
        MenstrualCyclesModule,
        MenstrualPredictionsModule,
        NotificationsModule,
        PackageServiceUsageModule,
        PackageServicesModule,
        PaymentsModule,
        RolesModule,
        ServicePackagesModule,
        ServicesModule,
        StiTestProcessesModule,
        SymptomsModule,
        TestResultsModule,
        UserPackageSubscriptionsModule,
        UsersModule,
        AuthModule,
        AuditLogsModule,
        FilesModule,
        ChatModule,
        TagsModule,
        RevenueStatsModule,
        ServicePackagesStatsModule,
        HealthModule,
    ],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ClassSerializerInterceptor,
        },
    ],
    controllers: [AppController],
})
export class AppModule {}
