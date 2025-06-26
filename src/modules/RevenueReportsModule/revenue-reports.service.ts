import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PaymentStatusType } from 'src/enums';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentRepositoryService } from '../payments/providers/payment-repository.service';
import { MonthlyRevenueReportDto } from './dto/monthly-revenue-report.dto';

@Injectable()
export class RevenueReportsService {
    constructor(
        private readonly paymentRepositoryService: PaymentRepositoryService,
    ) {}

    async getMonthlyRevenueData(query: MonthlyRevenueReportDto): Promise<any[]> {
        const { year, month } = query;
        const currentYear = new Date().getFullYear();
        const targetYear = year ? parseInt(year) : currentYear;
        const targetMonth = month ? parseInt(month) : undefined;

        // Lấy dữ liệu thanh toán đã hoàn thành
        const payments = await this.paymentRepositoryService.findPaymentsForReport({
            year: targetYear,
            month: targetMonth,
            status: PaymentStatusType.COMPLETED,
        });

        // Tính toán doanh thu theo tháng
        const monthlyRevenue = this.calculateMonthlyRevenue(payments, targetYear);

        // Chuẩn bị dữ liệu JSON
        return this.prepareWorksheetData(monthlyRevenue, targetYear, targetMonth);
    }

    async generateMonthlyRevenueReport(query: MonthlyRevenueReportDto): Promise<Buffer> {
        const worksheetData = await this.getMonthlyRevenueData(query);

        // Tạo worksheet từ dữ liệu
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);

        // Tùy chỉnh header
        worksheet['!cols'] = [
            { wch: 10 }, // Month
            { wch: 20 }, // Total Revenue
            { wch: 15 }, // Appointment Payments
            { wch: 15 }, // Service Payments
            { wch: 15 }, // Package Payments
            { wch: 15 }, // Transaction Count
        ];
        const headers = ['Month', 'Total Revenue', 'Appointment Payments', 'Service Payments', 'Package Payments', 'Transaction Count'];
        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });

        // Tạo workbook và xuất file
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Revenue');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        return excelBuffer;
    }

    private calculateMonthlyRevenue(payments: Payment[], year: number): Array<{
        month: number;
        totalRevenue: number;
        appointmentPayments: number;
        servicePayments: number;
        packagePayments: number;
        transactionCount: number;
    }> {
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            totalRevenue: 0,
            appointmentPayments: 0,
            servicePayments: 0,
            packagePayments: 0,
            transactionCount: 0,
        }));

        payments.forEach((payment) => {
            if (!payment.paymentDate) return; // Bỏ qua nếu paymentDate là null
            const paymentMonth = new Date(payment.paymentDate).getMonth();
            if (new Date(payment.paymentDate).getFullYear() === year) {
                const amount = Number(payment.amount) || 0; // Đảm bảo amount là số
                monthlyData[paymentMonth].totalRevenue += amount;
                monthlyData[paymentMonth].transactionCount += 1;

                if (payment.appointment) {
                    monthlyData[paymentMonth].appointmentPayments += amount;
                } else if (payment.service) {
                    monthlyData[paymentMonth].servicePayments += amount;
                } else if (payment.servicePackage) {
                    monthlyData[paymentMonth].packagePayments += amount;
                }
            }
        });

        return monthlyData;
    }

    private prepareWorksheetData(
        monthlyRevenue: Array<{
            month: number;
            totalRevenue: number;
            appointmentPayments: number;
            servicePayments: number;
            packagePayments: number;
            transactionCount: number;
        }>,
        year: number,
        targetMonth?: number,
    ): any[] {
        const data = monthlyRevenue
            .filter((item) => !targetMonth || item.month === targetMonth)
            .map((item) => ({
                Month: `${item.month}/${year}`,
                'Total Revenue': (Number(item.totalRevenue) || 0).toFixed(2),
                'Appointment Payments': (Number(item.appointmentPayments) || 0).toFixed(2),
                'Service Payments': (Number(item.servicePayments) || 0).toFixed(2),
                'Package Payments': (Number(item.packagePayments) || 0).toFixed(2),
                'Transaction Count': item.transactionCount,
            }));

        return data.length > 0
            ? data
            : [
                  {
                      Month: 'No Data',
                      'Total Revenue': '0.00',
                      'Appointment Payments': '0.00',
                      'Service Payments': '0.00',
                      'Package Payments': '0.00',
                      'Transaction Count': 0,
                  },
              ];
    }
}