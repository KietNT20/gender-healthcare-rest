import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueStatsController } from './revenue-stats.controller';
import { RevenueStatsService } from './revenue-stats.service';
import { Payment } from 'src/modules/payments/entities/payment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Payment])],
    controllers: [RevenueStatsController],
    providers: [RevenueStatsService],
    exports: [RevenueStatsService],
})
export class RevenueStatsModule {}
