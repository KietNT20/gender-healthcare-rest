import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ConsultantProfilesModule } from './modules/consultant-profiles/consultant-profiles.module';
import { EmploymentContractsModule } from './modules/employment-contracts/employment-contracts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServicesModule } from './modules/services/services.module';
import { ConsultantAvailabilityModule } from './modules/consultant-availability/consultant-availability.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { TagsModule } from './modules/tags/tags.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { AnswersModule } from './modules/answers/answers.module';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import { MoodsModule } from './modules/moods/moods.module';
import { PackageServiceUsageModule } from './modules/package-service-usage/package-service-usage.module';
import { UserPackageSubscriptionsModule } from './modules/user-package-subscriptions/user-package-subscriptions.module';
import { PackageServicesModule } from './modules/package-services/package-services.module';
import { ServicePackagesModule } from './modules/service-packages/service-packages.module';
import { ContractFilesModule } from './modules/contract-files/contract-files.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ImagesModule } from './modules/images/images.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { TestResultsModule } from './modules/test-results/test-results.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MenstrualPredictionsModule } from './modules/menstrual-predictions/menstrual-predictions.module';
import { ContraceptiveRemindersModule } from './modules/contraceptive-reminders/contraceptive-reminders.module';
import { CycleSymptomsModule } from './modules/cycle-symptoms/cycle-symptoms.module';
import { CycleMoodsModule } from './modules/cycle-moods/cycle-moods.module';
import { MenstrualCyclesModule } from './modules/menstrual-cycles/menstrual-cycles.module';
import { SymptomsModule } from './modules/symptoms/symptoms.module';
import { CycleTrackingModule } from './modules/cycle-tracking/cycle-tracking.module';
import { AppointmentServicesModule } from './modules/appointment-services/appointment-services.module';
import { BlogServiceRelationsModule } from './modules/blog-service-relations/blog-service-relations.module';
import { QuestionTagsModule } from './modules/question-tags/question-tags.module';
import { MoodsModule } from './modules/moods/moods.module';

@Module({
  imports: [UsersModule, RolesModule, ConsultantProfilesModule, EmploymentContractsModule, CategoriesModule, ServicesModule, ConsultantAvailabilityModule, AppointmentsModule, BlogsModule, TagsModule, QuestionsModule, AnswersModule, FeedbacksModule, MoodsModule, CycleTrackingModule, AppointmentServicesModule, BlogServiceRelationsModule, QuestionTagsModule, SymptomsModule, MenstrualCyclesModule, CycleMoodsModule, CycleSymptomsModule, ContraceptiveRemindersModule, MenstrualPredictionsModule, PaymentsModule, NotificationsModule, TestResultsModule, DocumentsModule, ImagesModule, AuditLogsModule, ContractFilesModule, ServicePackagesModule, PackageServicesModule, UserPackageSubscriptionsModule, PackageServiceUsageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
