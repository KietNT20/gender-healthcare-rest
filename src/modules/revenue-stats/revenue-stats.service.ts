import { Injectable, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentStatusType } from 'src/enums';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import * as ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import * as uuid from 'uuid';
import * as path from 'path';
import * as fs from 'fs';


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

    async generateRevenueReport(year: number): Promise<{ buffer: Buffer, filename: string }> {
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

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Revenue Report');

        worksheet.columns = [
            { header: 'Month', key: 'month', width: 10 },
            { header: 'Total Revenue', key: 'totalRevenue', width: 20 },
            { header: 'Payment ID', key: 'paymentId', width: 15 },
            { header: 'Payment Date', key: 'paymentDate', width: 20 },
            { header: 'Amount', key: 'amount', width: 15 },
        ];

        yearlyStats.forEach(stat => {
            const monthNum = Number(stat.month);
            const monthDetails = monthlyDetails.filter(d => Number(d.month) === monthNum);
            
            monthDetails.forEach((detail, index) => {
                worksheet.addRow({
                    month: monthNum,
                    totalRevenue: index === 0 ? parseFloat(stat.totalRevenue) : '',
                    paymentId: detail.id,
                    paymentDate: detail.paymentDate,
                    amount: parseFloat(detail.amount),
                });
            });

            if (monthDetails.length === 0) {
                worksheet.addRow({
                    month: monthNum,
                    totalRevenue: parseFloat(stat.totalRevenue),
                });
            }
        });

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCCCCCC' }
        };

        // Đường dẫn đến thư mục 'files'
        const directoryPath = path.join(__dirname, 'files');
        
        // Kiểm tra xem thư mục đã tồn tại chưa, nếu chưa thì tạo thư mục
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        // Tạo đường dẫn đầy đủ cho file Excel
        const filename = `Revenue_Report_${currentYear}_${uuid.v4()}.xlsx`;
        const filePath = path.join(directoryPath, filename); // Sử dụng thư mục đã tạo

        await workbook.xlsx.writeFile(filePath);

        // Đọc file vào buffer và trả về
        const buffer = fs.readFileSync(filePath);

        // Trả về buffer và filename
        return { buffer, filename };
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