import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../payments/entities/payment.entity';

import { PaymentsModule } from '../payments/payments.module';
import { RevenueReportsController } from './revenue-reports.controller';
import { RevenueReportsService } from './revenue-reports.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment]),
        PaymentsModule, // Import PaymentsModule để sử dụng PaymentRepositoryService
    ],
    controllers: [RevenueReportsController],
    providers: [RevenueReportsService],
    exports: [RevenueReportsService],
})
export class RevenueReportsModule {}