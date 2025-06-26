import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { UserPackageSubscription } from '../user-package-subscriptions/entities/user-package-subscription.entity';
import * as XLSX from 'xlsx';
import { ServicePackageStatsQueryDto } from './dto/service-package-stats-query.dto';

@Injectable()
export class ServicePackageStatsService {
    constructor(
        @InjectRepository(ServicePackage)
        private packageRepository: Repository<ServicePackage>,
        @InjectRepository(UserPackageSubscription)
        private subscriptionRepository: Repository<UserPackageSubscription>,
    ) {}

    /**
     * Get the most subscribed service package for a specific month and year
     * @param query Query parameters for month and year
     * @returns The most subscribed package and its subscription count
     */
    async getMostSubscribedPackage(query: ServicePackageStatsQueryDto) {
        const { month, year } = query;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // Default to current month/year if not provided
        const queryMonth = month ?? currentMonth;
        const queryYear = year ?? currentYear;

        // Build date range
        const startDate = new Date(queryYear, queryMonth - 1, 1);
        const endDate = new Date(queryYear, queryMonth, 0, 23, 59, 59, 999);

        // Query subscription statistics
        const stats = await this.subscriptionRepository
            .createQueryBuilder('subscription')
            .select('subscription.packageId', 'packageId')
            .addSelect('COUNT(subscription.id)', 'subscriptionCount')
            .innerJoin('subscription.package', 'package')
            .where('subscription.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .andWhere('package.deletedAt IS NULL')
            .andWhere('subscription.deletedAt IS NULL')
            .groupBy('subscription.packageId')
            .orderBy('COUNT(subscription.id)', 'DESC') // Use COUNT directly instead of alias
            .getRawMany();

        if (!stats.length) {
            throw new BadRequestException('Không tìm thấy dữ liệu đăng ký cho khoảng thời gian được chỉ định');
        }

        // Fetch detailed package information
        const topPackage = await this.packageRepository.findOne({
            where: { id: stats[0].packageId, deletedAt: IsNull() },
        });

        if (!topPackage) {
            throw new NotFoundException(`Service package with ID '${stats[0].packageId}' not found`);
        }

        return {
            package: topPackage,
            subscriptionCount: parseInt(stats[0].subscriptionCount),
            month: queryMonth,
            year: queryYear,
        };
    }

    /**
     * Generate an Excel report for all subscribed service packages
     * @param query Query parameters for month and year
     * @returns Excel file buffer and filename
     */
    async generateExcelReport(query: ServicePackageStatsQueryDto) {
        const { month, year } = query;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // Default to current month/year if not provided
        const queryMonth = month ?? currentMonth;
        const queryYear = year ?? currentYear;

        // Build date range
        const startDate = new Date(queryYear, queryMonth - 1, 1);
        const endDate = new Date(queryYear, queryMonth, 0, 23, 59, 59, 999);

        // Query subscription statistics for all packages
        const stats = await this.subscriptionRepository
            .createQueryBuilder('subscription')
            .select('subscription.packageId', 'packageId')
            .addSelect('COUNT(subscription.id)', 'subscriptionCount')
            .innerJoin('subscription.package', 'package')
            .where('subscription.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .andWhere('package.deletedAt IS NULL')
            .andWhere('subscription.deletedAt IS NULL')
            .groupBy('subscription.packageId')
            .orderBy('COUNT(subscription.id)', 'DESC')
            .getRawMany();

        if (!stats.length) {
            throw new BadRequestException('Không tìm thấy dữ liệu đăng ký cho khoảng thời gian được chỉ định');
        }

        // Fetch detailed package information for all packages
        const packages = await this.packageRepository.find({
            where: { deletedAt: IsNull() },
        });

        // Map stats to packages
        const reportData = packages.map(pkg => {
            const stat = stats.find(s => s.packageId === pkg.id);
            return {
                package: pkg,
                subscriptionCount: stat ? parseInt(stat.subscriptionCount) : 0,
            };
        }).filter(data => data.subscriptionCount > 0); // Only include packages with subscriptions

        if (!reportData.length) {
            throw new BadRequestException('Không tìm thấy đăng ký hoạt động nào cho khoảng thời gian được chỉ định');
        }

        // Create worksheet data with Vietnamese content
        const worksheetData = [
            ['BÁO CÁO ĐĂNG KÝ GÓI DỊCH VỤ'],
            ['Tháng', queryMonth],
            ['Năm', queryYear],
            [], // Empty row for spacing
            ['Tên Gói Dịch Vụ', 'Số Lượt Đăng Ký', 'Giá (VND)', 'Thời Gian (Tháng)', 'Trạng Thái'],
        ];

        // Add package data
        reportData.forEach(data => {
            worksheetData.push([
                data.package.name,
                data.subscriptionCount,
                data.package.price,
                data.package.durationMonths,
                data.package.isActive ? 'Hoạt động' : 'Không hoạt động',
            ]);
        });

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Apply styles
        if (!worksheet['!ref']) {
            throw new Error('Worksheet range is undefined');
        }
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!worksheet[cellAddress]) continue;

                // Base style for all cells
                worksheet[cellAddress].s = {
                    font: { name: 'Arial', sz: 12 },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' },
                    },
                };

                // Header row (row 0)
                if (R === 0) {
                    worksheet[cellAddress].s = {
                        ...worksheet[cellAddress].s,
                        font: { name: 'Arial', sz: 14, bold: true },
                        fill: { fgColor: { rgb: '4F81BD' } },
                    };
                }

                // Subheader rows (Month, Year) - row 1 and 2
                if (R === 1 || R === 2) {
                    worksheet[cellAddress].s = {
                        ...worksheet[cellAddress].s,
                        font: { ...worksheet[cellAddress].s.font, bold: true },
                        fill: { fgColor: { rgb: 'E6E6FA' } }, // Lavender background
                    };
                }

                // Column headers (row 4)
                if (R === 4) {
                    worksheet[cellAddress].s = {
                        ...worksheet[cellAddress].s,
                        font: { ...worksheet[cellAddress].s.font, bold: true },
                        fill: { fgColor: { rgb: 'DCE6F1' } }, // Light blue background
                    };
                }

                // Data rows (row 5 and beyond)
                if (R >= 5) {
                    worksheet[cellAddress].s = {
                        ...worksheet[cellAddress].s,
                        fill: { fgColor: { rgb: 'F5F5F5' } }, // Light gray background
                    };
                }
            }
        }

        // Set column widths
        worksheet['!cols'] = [
            { wch: 30 }, // Tên Gói Dịch Vụ
            { wch: 20 }, // Số Lượt Đăng Ký
            { wch: 15 }, // Giá (VND)
            { wch: 15 }, // Thời Gian (Tháng)
            { wch: 15 }, // Trạng Thái
        ];

        // Merge cells for title
        worksheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Merge title across 5 columns
        ];

        // Create workbook and append worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo Cáo');

        // Generate Excel buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        return {
            buffer,
            filename: `bao-cao-goi-dich-vu-${queryMonth}-${queryYear}.xlsx`,
        };
    }
}