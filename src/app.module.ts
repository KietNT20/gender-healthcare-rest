import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnswersModule } from './modules/answers/answers.module';
import { AppointmentServicesModule } from './modules/appointment-services/appointment-services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { BlogServiceRelationsModule } from './modules/blog-service-relations/blog-service-relations.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ConsultantAvailabilityModule } from './modules/consultant-availability/consultant-availability.module';
import { ConsultantProfilesModule } from './modules/consultant-profiles/consultant-profiles.module';
import { ContraceptiveRemindersModule } from './modules/contraceptive-reminders/contraceptive-reminders.module';
import { ContractFilesModule } from './modules/contract-files/contract-files.module';
import { CycleMoodsModule } from './modules/cycle-moods/cycle-moods.module';
import { CycleSymptomsModule } from './modules/cycle-symptoms/cycle-symptoms.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EmploymentContractsModule } from './modules/employment-contracts/employment-contracts.module';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import { ImagesModule } from './modules/images/images.module';
import { MenstrualCyclesModule } from './modules/menstrual-cycles/menstrual-cycles.module';
import { MenstrualPredictionsModule } from './modules/menstrual-predictions/menstrual-predictions.module';
import { MoodsModule } from './modules/moods/moods.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PackageServiceUsageModule } from './modules/package-service-usage/package-service-usage.module';
import { PackageServicesModule } from './modules/package-services/package-services.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { QuestionTagsModule } from './modules/question-tags/question-tags.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { RolesModule } from './modules/roles/roles.module';
import { ServicePackagesModule } from './modules/service-packages/service-packages.module';
import { ServicesModule } from './modules/services/services.module';
import { SymptomsModule } from './modules/symptoms/symptoms.module';
import { TagsModule } from './modules/tags/tags.module';
import { TestResultsModule } from './modules/test-results/test-results.module';
import { UserPackageSubscriptionsModule } from './modules/user-package-subscriptions/user-package-subscriptions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UsersModule,
    RolesModule,
    ConsultantProfilesModule,
    EmploymentContractsModule,
    CategoriesModule,
    ServicesModule,
    ConsultantAvailabilityModule,
    AppointmentsModule,
    BlogsModule,
    TagsModule,
    QuestionsModule,
    AnswersModule,
    FeedbacksModule,
    MoodsModule,
    AppointmentServicesModule,
    BlogServiceRelationsModule,
    QuestionTagsModule,
    SymptomsModule,
    MenstrualCyclesModule,
    CycleMoodsModule,
    CycleSymptomsModule,
    ContraceptiveRemindersModule,
    MenstrualPredictionsModule,
    PaymentsModule,
    NotificationsModule,
    TestResultsModule,
    DocumentsModule,
    ImagesModule,
    AuditLogsModule,
    ContractFilesModule,
    ServicePackagesModule,
    PackageServicesModule,
    UserPackageSubscriptionsModule,
    PackageServiceUsageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
