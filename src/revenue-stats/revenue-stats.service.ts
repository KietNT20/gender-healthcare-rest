import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentStatusType } from 'src/enums';
import { GetMonthlyRevenueDto } from './dto/revenue-stats.dto';
import { Payment } from 'src/modules/payments/entities/payment.entity';

@Injectable()
export class RevenueStatsService {
    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
    ) {}

    async getMonthlyRevenue(dto: GetMonthlyRevenueDto) {
        const { year } = dto;
        const revenue = await this.paymentRepository
            .createQueryBuilder('payment')
            .select("TO_CHAR(payment.paymentDate, 'MM')", 'month')
            .addSelect('SUM(payment.amount)', 'total')
            .where('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .andWhere('EXTRACT(YEAR FROM payment.paymentDate) = :year', {
                year,
            })
            .groupBy("TO_CHAR(payment.paymentDate, 'MM')")
            .orderBy("TO_CHAR(payment.paymentDate, 'MM')", 'ASC')
            .getRawMany();

        const result = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            total: 0,
        }));

        revenue.forEach((item) => {
            const monthIndex = parseInt(item.month, 10) - 1;
            result[monthIndex].total = parseFloat(item.total) || 0;
        });

        return result;
    }
}
