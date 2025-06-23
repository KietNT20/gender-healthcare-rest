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
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Payment,
            Appointment,
            User,
            ServicePackage,
            Service,
        ]),
        AppointmentsModule,
        ServicePackagesModule,
        forwardRef(() => UserPackageSubscriptionsModule),
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService, PaymentServicesService],
    exports: [PaymentsService, PaymentServicesService],
})
export class PaymentsModule {}
