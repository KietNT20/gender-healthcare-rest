import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentStatusType } from 'src/enums';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RevenueStatsService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
    ) {}

    async getMonthlyRevenueStats(year?: number, month?: number) {
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${currentYear + 1}-01-01`);

        let query = this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                "EXTRACT(MONTH FROM payment.paymentDate) as month",
                'COALESCE(SUM(payment.amount), 0) as totalRevenue',
            ])
            .where('payment.status = :status', { status: PaymentStatusType.COMPLETED })
            .andWhere('payment.paymentDate IS NOT NULL')
            .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', { 
                startDate, 
                endDate 
            })
            .groupBy("EXTRACT(MONTH FROM payment.paymentDate)")
            .orderBy("month", "ASC");

        if (month) {
            query = query.andWhere('EXTRACT(MONTH FROM payment.paymentDate) = :month', { month });
        }

        const monthlyStats = await query.getRawMany();

        console.log('Monthly stats raw data:', monthlyStats);

        const result = Array(12).fill(0).map((_, index) => {
            const monthNum = index + 1;
            const stat = monthlyStats.find(s => Number(s.month) === monthNum);
            if (month && monthNum !== month) return null;
            return {
                month: monthNum,
                totalRevenue: stat ? parseFloat(stat.totalrevenue || stat.totalRevenue || '0') : 0,
            };
        }).filter(r => r !== null);

        console.log('Processed result:', result);

        return { 
            year: currentYear, 
            stats: result 
        };
    }

    async getYearlyRevenueStats(year?: number) {
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${currentYear + 1}-01-01`);

        const yearlyStats = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                "EXTRACT(MONTH FROM payment.paymentDate) as month",
                'COALESCE(SUM(payment.amount), 0) as totalRevenue',
            ])
            .where('payment.status = :status', { status: PaymentStatusType.COMPLETED })
            .andWhere('payment.paymentDate IS NOT NULL')
            .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', { 
                startDate, 
                endDate 
            })
            .groupBy("EXTRACT(MONTH FROM payment.paymentDate)")
            .orderBy("month", "ASC")
            .getRawMany();

        const monthlyDetails = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                "EXTRACT(MONTH FROM payment.paymentDate) as month",
                'payment.paymentDate',
                'payment.amount',
                'payment.id'
            ])
            .where('payment.status = :status', { status: PaymentStatusType.COMPLETED })
            .andWhere('payment.paymentDate IS NOT NULL')
            .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', { 
                startDate, 
                endDate 
            })
            .orderBy("payment.paymentDate", "ASC")
            .getRawMany();

        console.log('Yearly stats raw data:', yearlyStats);
        console.log('Monthly details raw data:', monthlyDetails);

        const result = Array(12).fill(null).map((_, index) => {
            const monthNum = index + 1;
            const stat = yearlyStats.find(s => Number(s.month) === monthNum);
            return {
                month: monthNum,
                totalRevenue: stat ? parseFloat(stat.totalrevenue || stat.totalRevenue || '0') : null,
                details: monthlyDetails.filter(d => Number(d.month) === monthNum).map(d => ({
                    id: d.id,
                    paymentDate: d.paymentDate,
                    amount: parseFloat(d.amount)
                }))
            };
        });

        console.log('Processed yearly result:', result);

        return { 
            year: currentYear, 
            stats: result 
        };
    }

    async getMonthlyDetails(year?: number) {
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${currentYear + 1}-01-01`);

        const monthlyDetails = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                "EXTRACT(MONTH FROM payment.paymentDate) as month",
                'payment.paymentDate',
                'payment.amount',
                'payment.id'
            ])
            .where('payment.status = :status', { status: PaymentStatusType.COMPLETED })
            .andWhere('payment.paymentDate IS NOT NULL')
            .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', { 
                startDate, 
                endDate 
            })
            .orderBy("payment.paymentDate", "ASC")
            .getRawMany();

        console.log('Monthly details raw data:', monthlyDetails);

        const result = Array(12).fill(null).map((_, index) => {
            const monthNum = index + 1;
            return {
                month: monthNum,
                details: monthlyDetails.filter(d => Number(d.month) === monthNum).map(d => ({
                    id: d.id,
                    paymentDate: d.paymentDate,
                    amount: parseFloat(d.amount)
                }))
            };
        });

        console.log('Processed monthly details:', result);

        return { 
            year: currentYear, 
            details: result 
        };
    }

    async debugPaymentData(year?: number) {
        const currentYear = year || new Date().getFullYear();
        
        const allPayments = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                'payment.id',
                'payment.amount',
                'payment.status',
                'payment.paymentDate'
            ])
            .where('EXTRACT(YEAR FROM payment.paymentDate) = :year', { year: currentYear })
            .orderBy('payment.paymentDate', 'ASC')
            .getMany();

        console.log('All payments in year:', allPayments);

        const completedPayments = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                'payment.id',
                'payment.amount',
                'payment.status',
                'payment.paymentDate'
            ])
            .where('payment.status = :status', { status: PaymentStatusType.COMPLETED })
            .andWhere('payment.paymentDate IS NOT NULL')
            .andWhere('EXTRACT(YEAR FROM payment.paymentDate) = :year', { year: currentYear })
            .orderBy('payment.paymentDate', 'ASC')
            .getMany();

        console.log('Completed payments:', completedPayments);

        return {
            allPayments,
            completedPayments,
            totalCompleted: completedPayments.length,
            totalAmount: completedPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
        };
    }
}