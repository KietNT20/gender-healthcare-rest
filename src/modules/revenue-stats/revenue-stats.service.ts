import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { PaymentStatusType } from 'src/enums';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Between, Repository } from 'typeorm';

@Injectable()
export class RevenueStatsService {
    private readonly logger = new Logger(RevenueStatsService.name);

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
    ) {}

    async getMonthlyRevenueStats(year?: number, month?: number) {
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${currentYear + 1}-01-01`);

        this.logger.log(
            `Getting monthly revenue stats for year: ${currentYear}, month: ${month || 'all'}`,
        );

        // Lấy tất cả payments trong năm
        const payments = await this.paymentRepository.find({
            where: {
                status: PaymentStatusType.COMPLETED,
                paymentDate: Between(startDate, endDate),
            },
            select: ['id', 'amount', 'paymentDate'],
        });

        this.logger.log(`Found ${payments.length} completed payments`);

        // Xử lý dữ liệu theo tháng
        const monthlyData = new Map<
            number,
            { totalRevenue: number; transactionCount: number }
        >();

        payments.forEach((payment) => {
            const paymentMonth = payment.paymentDate.getMonth() + 1; // getMonth() trả về 0-11
            const amount = parseFloat(payment.amount.toString());

            if (!monthlyData.has(paymentMonth)) {
                monthlyData.set(paymentMonth, {
                    totalRevenue: 0,
                    transactionCount: 0,
                });
            }

            const monthData = monthlyData.get(paymentMonth)!;
            monthData.totalRevenue += amount;
            monthData.transactionCount += 1;
        });

        // Tạo kết quả cho tất cả 12 tháng
        const result = Array(12)
            .fill(null)
            .map((_, index) => {
                const monthNum = index + 1;
                const monthData = monthlyData.get(monthNum);

                // Nếu chỉ lấy một tháng cụ thể và không phải tháng này thì return null
                if (month && monthNum !== month) {
                    return null;
                }

                return {
                    month: monthNum,
                    totalRevenue: monthData?.totalRevenue || 0,
                    transactionCount: monthData?.transactionCount || 0,
                };
            })
            .filter((r) => r !== null);

        this.logger.log('Processed result:', result);

        return {
            year: currentYear,
            stats: result,
        };
    }

    async getYearlyRevenueStats(year?: number) {
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${currentYear + 1}-01-01`);

        this.logger.log(
            `Getting yearly revenue stats for year: ${currentYear}`,
        );

        // Lấy tất cả payments trong năm
        const payments = await this.paymentRepository.find({
            where: {
                status: PaymentStatusType.COMPLETED,
                paymentDate: Between(startDate, endDate),
            },
            select: ['id', 'amount', 'paymentDate'],
            order: {
                paymentDate: 'ASC',
            },
        });

        this.logger.log(
            `Found ${payments.length} completed payments for yearly stats`,
        );

        // Xử lý dữ liệu theo tháng
        const monthlyData = new Map<
            number,
            {
                totalRevenue: number;
                transactionCount: number;
                details: Array<{
                    id: string;
                    paymentDate: Date;
                    amount: number;
                }>;
            }
        >();

        payments.forEach((payment) => {
            const paymentMonth = payment.paymentDate.getMonth() + 1; // getMonth() trả về 0-11
            const amount = parseFloat(payment.amount.toString());

            if (!monthlyData.has(paymentMonth)) {
                monthlyData.set(paymentMonth, {
                    totalRevenue: 0,
                    transactionCount: 0,
                    details: [],
                });
            }

            const monthData = monthlyData.get(paymentMonth)!;
            monthData.totalRevenue += amount;
            monthData.transactionCount += 1;
            monthData.details.push({
                id: payment.id,
                paymentDate: payment.paymentDate,
                amount: amount,
            });
        });

        // Tạo kết quả cho tất cả 12 tháng
        const result = Array(12)
            .fill(null)
            .map((_, index) => {
                const monthNum = index + 1;
                const monthData = monthlyData.get(monthNum);

                return {
                    month: monthNum,
                    totalRevenue: monthData?.totalRevenue || null,
                    details: monthData?.details || [],
                };
            });

        this.logger.log('Processed yearly result:', result);

        return {
            year: currentYear,
            stats: result,
        };
    }

    async getMonthlyDetails(year?: number) {
        const currentYear = year || new Date().getFullYear();
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${currentYear + 1}-01-01`);

        this.logger.log(`Getting monthly details for year: ${currentYear}`);

        // Lấy tất cả payments trong năm
        const payments = await this.paymentRepository.find({
            where: {
                status: PaymentStatusType.COMPLETED,
                paymentDate: Between(startDate, endDate),
            },
            select: ['id', 'amount', 'paymentDate'],
            order: {
                paymentDate: 'ASC',
            },
        });

        this.logger.log(
            `Found ${payments.length} completed payments for monthly details`,
        );

        // Xử lý dữ liệu theo tháng
        const monthlyData = new Map<
            number,
            Array<{ id: string; paymentDate: Date; amount: number }>
        >();

        payments.forEach((payment) => {
            const paymentMonth = payment.paymentDate.getMonth() + 1; // getMonth() trả về 0-11
            const amount = parseFloat(payment.amount.toString());

            if (!monthlyData.has(paymentMonth)) {
                monthlyData.set(paymentMonth, []);
            }

            const monthDetails = monthlyData.get(paymentMonth)!;
            monthDetails.push({
                id: payment.id,
                paymentDate: payment.paymentDate,
                amount: amount,
            });
        });

        // Tạo kết quả cho tất cả 12 tháng
        const result = Array(12)
            .fill(null)
            .map((_, index) => {
                const monthNum = index + 1;
                const monthDetails = monthlyData.get(monthNum);

                return {
                    month: monthNum,
                    details: monthDetails || [],
                };
            });

        this.logger.log('Processed monthly details:', result);

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
}
