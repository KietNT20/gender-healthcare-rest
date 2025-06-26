import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentStatusType } from 'src/enums';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import * as ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import * as uuid from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { RevenueStatsDto } from './dto/revenue-stats.dto';

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
                'EXTRACT(MONTH FROM payment.paymentDate) as month',
                'COALESCE(SUM(payment.amount), 0) as totalRevenue',
            ])
            .where('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .andWhere('payment.paymentDate IS NOT NULL')
            .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .groupBy('EXTRACT(MONTH FROM payment.paymentDate)')
            .orderBy('month', 'ASC');

        if (month) {
            query = query.andWhere(
                'EXTRACT(MONTH FROM payment.paymentDate) = :month',
                { month },
            );
        }

        const monthlyStats = await query.getRawMany();

        console.log('Monthly stats raw data:', monthlyStats);

        const result = Array(12)
            .fill(0)
            .map((_, index) => {
                const monthNum = index + 1;
                const stat = monthlyStats.find(
                    (s) => Number(s.month) === monthNum,
                );
                if (month && monthNum !== month) return null;
                return {
                    month: monthNum,
                    totalRevenue: stat
                        ? parseFloat(
                              stat.totalrevenue || stat.totalRevenue || '0',
                          )
                        : 0,
                };
            })
            .filter((r) => r !== null);

        console.log('Processed result:', result);

        return {
            year: currentYear,
            stats: result,
        };
    }

    async getYearlyRevenueStats(year?: number) {
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${currentYear + 1}-01-01`);

        const yearlyStats = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                'EXTRACT(MONTH FROM payment.paymentDate) as month',
                'COALESCE(SUM(payment.amount), 0) as totalRevenue',
            ])
            .where('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .andWhere('payment.paymentDate IS NOT NULL')
            .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .groupBy('EXTRACT(MONTH FROM payment.paymentDate)')
            .orderBy('month', 'ASC')
            .getRawMany();

        const monthlyDetails = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                'EXTRACT(MONTH FROM payment.paymentDate) as month',
                'payment.paymentDate',
                'payment.amount',
                'payment.id',
            ])
            .where('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .andWhere('payment.paymentDate IS NOT NULL')
            .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .orderBy('payment.paymentDate', 'ASC')
            .getRawMany();

        console.log('Yearly stats raw data:', yearlyStats);
        console.log('Monthly details raw data:', monthlyDetails);

        const result = Array(12)
            .fill(null)
            .map((_, index) => {
                const monthNum = index + 1;
                const stat = yearlyStats.find(
                    (s) => Number(s.month) === monthNum,
                );
                return {
                    month: monthNum,
                    totalRevenue: stat
                        ? parseFloat(
                              stat.totalrevenue || stat.totalRevenue || '0',
                          )
                        : null,
                    details: monthlyDetails
                        .filter((d) => Number(d.month) === monthNum)
                        .map((d) => ({
                            id: d.id,
                            paymentDate: d.paymentDate,
                            amount: parseFloat(d.amount),
                        })),
                };
            });

        console.log('Processed yearly result:', result);

        return {
            year: currentYear,
            stats: result,
        };
    }

    async getMonthlyDetails(year?: number) {
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${currentYear + 1}-01-01`);

        const monthlyDetails = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                'EXTRACT(MONTH FROM payment.paymentDate) as month',
                'payment.paymentDate',
                'payment.amount',
                'payment.id',
            ])
            .where('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .andWhere('payment.paymentDate IS NOT NULL')
            .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .orderBy('payment.paymentDate', 'ASC')
            .getRawMany();

        console.log('Monthly details raw data:', monthlyDetails);

        const result = Array(12)
            .fill(null)
            .map((_, index) => {
                const monthNum = index + 1;
                return {
                    month: monthNum,
                    details: monthlyDetails
                        .filter((d) => Number(d.month) === monthNum)
                        .map((d) => ({
                            id: d.id,
                            paymentDate: d.paymentDate,
                            amount: parseFloat(d.amount),
                        })),
                };
            });

        console.log('Processed monthly details:', result);

        return {
            year: currentYear,
            details: result,
        };
    }

    async exportRevenueStats(year?: number) {
        const stats = await this.getYearlyRevenueStats(year);
        const currentYear = year || new Date().getFullYear();

        if (!stats.stats || stats.stats.length === 0) {
            throw new NotFoundException(
                'No revenue data found for the specified year',
            );
        }

        const workbook = new ExcelJS.Workbook();

        // === Sheet Tổng Quan ===
        const summarySheet = workbook.addWorksheet('Tổng Quan');

        // Tiêu đề chính
        summarySheet.mergeCells('A1:C1');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = 'BÁO CÁO THỐNG KÊ DOANH THU';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.alignment = { horizontal: 'center' };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' },
        };

        // Năm
        summarySheet.mergeCells('A2:D2');
        const yearCell = summarySheet.getCell('A2');
        yearCell.value = `Năm ${currentYear}`;
        yearCell.font = { size: 16, bold: true, color: { argb: 'FF007ACC' } };
        yearCell.alignment = { horizontal: 'center', vertical: 'middle' };
        yearCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F0FA' },
        };

        // Header bảng
        const headerRow = summarySheet.addRow([
            'Tháng',
            'Tổng Doanh Thu (VND)',
            'Số Giao Dịch',
        ]);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' },
        };

        // Dữ liệu tháng
        stats.stats.forEach((stat) => {
            if (stat && stat.totalRevenue !== null) {
                summarySheet.addRow([
                    stat.month,
                    Number(stat.totalRevenue.toFixed(2)),
                    stat.details.length,
                ]);
            }
        });

        // Tổng cộng
        summarySheet.addRow([]);
        const totalRevenue = stats.stats.reduce(
            (sum, stat) =>
                stat && stat.totalRevenue !== null
                    ? sum + stat.totalRevenue
                    : sum,
            0,
        );
        const totalTransactions = stats.stats.reduce(
            (sum, stat) =>
                stat && stat.details ? sum + stat.details.length : sum,
            0,
        );

        const totalRow = summarySheet.addRow([
            'Tổng cộng',
            totalRevenue,
            totalTransactions,
        ]);
        totalRow.font = { bold: true };
        totalRow.alignment = { horizontal: 'center' };
        totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' },
        };

        // Kẻ border cho toàn bộ vùng dữ liệu
        const lastRow = summarySheet.lastRow
            ? summarySheet.lastRow.number
            : summarySheet.rowCount;
        for (let i = 3; i <= lastRow; i++) {
            // từ header (row 3) đến tổng cộng
            const row = summarySheet.getRow(i);
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                cell.alignment = { horizontal: 'center' };
            });
        }

        // === Sheet Chi Tiết ===
        const transactionSheet = workbook.addWorksheet('Chi Tiết');

        // Tiêu đề chính
        transactionSheet.mergeCells('A1:D1');
        const transTitleCell = transactionSheet.getCell('A1');
        transTitleCell.value = 'CHI TIẾT GIAO DỊCH';
        transTitleCell.font = {
            size: 14,
            bold: true,
            color: { argb: 'FFFFFFFF' },
        };
        transTitleCell.alignment = { horizontal: 'center' };
        transTitleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' },
        };

        // Header bảng chi tiết
        const transHeader = transactionSheet.addRow([
            'Tháng',
            'Mã Thanh Toán',
            'Ngày Thanh Toán',
            'Số Tiền (VND)',
        ]);
        transHeader.font = { bold: true };
        transHeader.alignment = { horizontal: 'center' };
        transHeader.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' },
        };

        // Dữ liệu chi tiết
        stats.stats.forEach((stat) => {
            if (stat && stat.details && stat.details.length > 0) {
                stat.details.forEach((detail) => {
                    transactionSheet.addRow([
                        stat.month,
                        detail.id,
                        new Date(detail.paymentDate).toLocaleString(),
                        Number(detail.amount.toFixed(2)),
                    ]);
                });
            }
        });

        // Kẻ border cho sheet chi tiết
        const lastTransRow = transactionSheet.lastRow
            ? transactionSheet.lastRow.number
            : transactionSheet.rowCount;
        for (let i = 3; i <= lastTransRow; i++) {
            const row = transactionSheet.getRow(i);
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                cell.alignment = { horizontal: 'center' };
            });
        }

        // Xuất file buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }

    async debugPaymentData(year?: number) {
        const currentYear = year || new Date().getFullYear();

        const allPayments = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                'payment.id',
                'payment.amount',
                'payment.status',
                'payment.paymentDate',
            ])
            .where('EXTRACT(YEAR FROM payment.paymentDate) = :year', {
                year: currentYear,
            })
            .orderBy('payment.paymentDate', 'ASC')
            .getMany();

        console.log('All payments in year:', allPayments);

        const completedPayments = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
                'payment.id',
                'payment.amount',
                'payment.status',
                'payment.paymentDate',
            ])
            .where('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .andWhere('payment.paymentDate IS NOT NULL')
            .andWhere('EXTRACT(YEAR FROM payment.paymentDate) = :year', {
                year: currentYear,
            })
            .orderBy('payment.paymentDate', 'ASC')
            .getMany();

        console.log('Completed payments:', completedPayments);

        return {
            allPayments,
            completedPayments,
            totalCompleted: completedPayments.length,
            totalAmount: completedPayments.reduce(
                (sum, p) => sum + parseFloat(p.amount.toString()),
                0,
            ),
        };
    }
}
