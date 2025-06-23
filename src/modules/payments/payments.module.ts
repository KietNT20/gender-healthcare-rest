import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsModule } from '../appointments/appointments.module';
import { Appointment } from '../appointments/entities/appointment.entity';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { ServicePackagesModule } from '../service-packages/service-packages.module';
import { Service } from '../services/entities/service.entity';
import { UserPackageSubscriptionsModule } from '../user-package-subscriptions/user-package-subscriptions.module';
import { User } from '../users/entities/user.entity';
import { Payment } from './entities/payment.entity';
import { PaymentServicesService } from './payment-services.service';
import { PaymentSubscriptionService } from './payment-subscription.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentCallbackService } from './providers/payment-callback.service';
import { PaymentLinkService } from './providers/payment-link.service';
import { PaymentRepositoryService } from './providers/payment-repository.service';
import { PaymentValidationService } from './providers/payment-validation.service';
import { PayOSService } from './providers/payos.service';
import { UserPaymentService } from './providers/user-payment.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Payment,
            Appointment,
            User,
            ServicePackage,
            Service,
        ]),
        ServicePackagesModule,
        forwardRef(() => AppointmentsModule),
        forwardRef(() => UserPackageSubscriptionsModule),
    ],
    controllers: [PaymentsController],
    providers: [
        PaymentsService,
        PaymentServicesService,
        PaymentSubscriptionService,
        PaymentCallbackService,
        PaymentLinkService,
        PaymentRepositoryService,
        PaymentValidationService,
        PayOSService,
        UserPaymentService,
    ],
    exports: [
        PaymentsService,
        PaymentServicesService,
        PaymentSubscriptionService,
        PaymentCallbackService,
        PaymentLinkService,
        PaymentRepositoryService,
        PaymentValidationService,
        PayOSService,
        UserPaymentService,
    ],
})
export class PaymentsModule {}
