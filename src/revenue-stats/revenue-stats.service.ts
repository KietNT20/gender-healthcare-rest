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

    async getMonthlyRevenueStats(year?: number) {
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${currentYear + 1}-01-01`);

        const monthlyStats = await this.paymentRepository
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

        console.log('Monthly stats raw data:', monthlyStats);

        // Tạo mảng 12 tháng với giá trị mặc định là 0
        const result = Array(12).fill(0).map((_, index) => {
            const month = index + 1;
            const stat = monthlyStats.find(s => Number(s.month) === month);
            
            return {
                month,
                totalRevenue: stat ? parseFloat(stat.totalrevenue || stat.totalRevenue || '0') : 0,
            };
        });

        console.log('Processed result:', result);

        return { 
            year: currentYear, 
            stats: result 
        };
    }

    // Phương thức debug để kiểm tra dữ liệu
    async debugPaymentData(year?: number) {
        const currentYear = year || new Date().getFullYear();
        
        // Kiểm tra tất cả payments trong năm
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

        // Kiểm tra chỉ completed payments
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