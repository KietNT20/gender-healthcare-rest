import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { IsNull, Repository } from 'typeorm';
import { ServicePackage } from '../service-packages/entities/service-package.entity';
import { UserPackageSubscription } from '../user-package-subscriptions/entities/user-package-subscription.entity';
import { ServicePackagesStatsQueryDto } from './dto/service-packages-stats-query.dto';

@Injectable()
export class ServicePackagesStatsService {
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
    async getMostSubscribedPackage(query: ServicePackagesStatsQueryDto) {
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
            .orderBy('COUNT(subscription.id)', 'DESC')
            .getRawMany();

        if (!stats.length) {
            return {
                message:
                    'Không có gói dịch vụ nào được đăng ký trong tháng này',
                month: queryMonth,
                year: queryYear,
            };
        }

        // Fetch detailed package information
        const topPackage = await this.packageRepository.findOne({
            where: { id: stats[0].packageId, deletedAt: IsNull() },
        });

        if (!topPackage) {
            throw new NotFoundException(
                `Service package with ID '${stats[0].packageId}' not found`,
            );
        }

        return {
            package: topPackage,
            subscriptionCount: parseInt(stats[0].subscriptionCount),
            month: queryMonth,
            year: queryYear,
        };
    }

    /**
     * Get statistics for all service packages in a specific month and year
     * @param query Query parameters for month and year
     * @returns List of all packages with their subscription counts
     */
    async getAllPackageStats(query: ServicePackagesStatsQueryDto) {
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

        // Kiểm tra nếu không có dữ liệu đăng ký
        if (!stats.length) {
            throw new BadRequestException(
                'Không tìm thấy dữ liệu đăng ký cho khoảng thời gian được chỉ định',
            );
        }

        // Fetch detailed package information for all packages
        const packages = await this.packageRepository.find({
            where: { deletedAt: IsNull() },
        });

        // Map stats to packages
        const reportData = packages.map((pkg) => {
            const stat = stats.find((s) => s.packageId === pkg.id);
            return {
                package: {
                    id: pkg.id,
                    name: pkg.name,
                    price: pkg.price,
                    durationMonths: pkg.durationMonths,
                    isActive: pkg.isActive,
                },
                subscriptionCount: stat ? parseInt(stat.subscriptionCount) : 0,
            };
        });

        return {
            packages: reportData,
            month: queryMonth,
            year: queryYear,
            totalSubscriptions: reportData.reduce(
                (sum, data) => sum + data.subscriptionCount,
                0,
            ),
        };
    }

    /**
     * Generate an Excel report for all subscribed service packages
     * @param query Query parameters for month and year
     * @returns Excel file buffer and filename
     */
    async generateExcelReport(query: ServicePackagesStatsQueryDto) {
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
            throw new BadRequestException(
                'Không tìm thấy dữ liệu đăng ký cho khoảng thời gian được chỉ định',
            );
        }

        // Fetch detailed package information for all packages
        const packages = await this.packageRepository.find({
            where: { deletedAt: IsNull() },
        });

        // Map stats to packages
        const reportData = packages
            .map((pkg) => {
                const stat = stats.find((s) => s.packageId === pkg.id);
                return {
                    package: pkg,
                    subscriptionCount: stat
                        ? parseInt(stat.subscriptionCount)
                        : 0,
                };
            })
            .filter((data) => data.subscriptionCount > 0); // Only include packages with subscriptions

        if (!reportData.length) {
            throw new BadRequestException(
                'Không tìm thấy đăng ký hoạt động nào cho khoảng thời gian được chỉ định',
            );
        }

        const workbook = new ExcelJS.Workbook();

        // === Sheet Tổng Quan ===
        const summarySheet = workbook.addWorksheet('Tổng Quan');

        // Tiêu đề chính
        summarySheet.mergeCells('A1:E1');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = 'BÁO CÁO ĐĂNG KÝ GÓI DỊCH VỤ';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }, // Màu xanh đậm
        };

        // Tháng và Năm
        summarySheet.mergeCells('A2:E2');
        const periodCell = summarySheet.getCell('A2');
        periodCell.value = `Tháng ${queryMonth} - Năm ${queryYear}`;
        periodCell.font = { size: 14, bold: true, color: { argb: 'FF007ACC' } };
        periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
        periodCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F0FA' }, // Màu xanh nhạt
        };

        // Header bảng
        const headerRow = summarySheet.addRow([
            'Tên Gói Dịch Vụ',
            'Số Lượt Đăng Ký',
            'Giá (VND)',
            'Thời Gian (Tháng)',
            'Trạng Thái',
        ]);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }, // Màu xám nhạt cho header
            };
            cell.border = {
                top: { style: 'medium', color: { argb: 'FF000000' } },
                left: { style: 'medium', color: { argb: 'FF000000' } },
                bottom: { style: 'medium', color: { argb: 'FF000000' } },
                right: { style: 'medium', color: { argb: 'FF000000' } },
            };
        });

        // Dữ liệu tháng với màu nền xen kẽ
        let isEven = false;
        reportData.forEach((data) => {
            const row = summarySheet.addRow([
                data.package.name,
                data.subscriptionCount,
                data.package.price,
                data.package.durationMonths,
                data.package.isActive ? 'Hoạt động' : 'Không hoạt động',
            ]);
            row.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: isEven ? 'FFF2F2F2' : 'FFFFFFFF' }, // Xen kẽ màu xám nhạt và trắng
                };
            });
            isEven = !isEven;
        });

        // === Sheet Chi Tiết ===
        const detailSheet = workbook.addWorksheet('Chi Tiết');

        // Tiêu đề chính
        detailSheet.mergeCells('A1:E1');
        const detailTitleCell = detailSheet.getCell('A1');
        detailTitleCell.value = 'CHI TIẾT ĐĂNG KÝ GÓI DỊCH VỤ';
        detailTitleCell.font = {
            size: 14,
            bold: true,
            color: { argb: 'FFFFFFFF' },
        };
        detailTitleCell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
        };
        detailTitleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }, // Màu xanh đậm
        };

        // Header bảng chi tiết
        const detailHeader = detailSheet.addRow([
            'Tên Gói Dịch Vụ',
            'Số Lượt Đăng Ký',
            'Giá (VND)',
            'Thời Gian (Tháng)',
            'Trạng Thái',
        ]);
        detailHeader.eachCell((cell) => {
            cell.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }, // Màu xám nhạt cho header
            };
            cell.border = {
                top: { style: 'medium', color: { argb: 'FF000000' } },
                left: { style: 'medium', color: { argb: 'FF000000' } },
                bottom: { style: 'medium', color: { argb: 'FF000000' } },
                right: { style: 'medium', color: { argb: 'FF000000' } },
            };
        });

        // Dữ liệu chi tiết với màu nền xen kẽ
        let isEvenDetail = false;
        reportData.forEach((data) => {
            const row = detailSheet.addRow([
                data.package.name,
                data.subscriptionCount,
                data.package.price,
                data.package.durationMonths,
                data.package.isActive ? 'Hoạt động' : 'Không hoạt động',
            ]);
            row.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: isEvenDetail ? 'FFF2F2F2' : 'FFFFFFFF' }, // Xen kẽ màu xám nhạt và trắng
                };
            });
            isEvenDetail = !isEvenDetail;
        });

        // Điều chỉnh chiều rộng cột dựa trên nội dung tối đa
        const adjustColumnWidths = (sheet: ExcelJS.Worksheet) => {
            sheet.columns.forEach((column: ExcelJS.Column, index: number) => {
                let maxLength = 0;
                column.eachCell(
                    { includeEmpty: true },
                    (cell: ExcelJS.Cell) => {
                        const cellLength = cell.text ? cell.text.length : 0;
                        if (cellLength > maxLength) {
                            maxLength = cellLength;
                        }
                    },
                );
                // Thêm padding và căn chỉnh với tiêu đề
                const headerLength = [
                    'Tên Gói Dịch Vụ',
                    'Số Lượt Đăng Ký',
                    'Giá (VND)',
                    'Thời Gian (Tháng)',
                    'Trạng Thái',
                ][index].length;
                column.width = Math.max(maxLength + 2, headerLength + 2, 15); // Tối thiểu 15, cộng thêm 2 cho padding
            });
        };
        adjustColumnWidths(summarySheet);
        adjustColumnWidths(detailSheet);

        // Điều chỉnh chiều cao hàng
        const adjustRowHeight = (sheet: ExcelJS.Worksheet) => {
            sheet.getRows(1, sheet.rowCount)?.forEach((row: ExcelJS.Row) => {
                row.height = 30; // Chiều cao cố định 30
            });
        };
        adjustRowHeight(summarySheet);
        adjustRowHeight(detailSheet);

        // Xuất file buffer
        const buffer = await workbook.xlsx.writeBuffer();

        return {
            buffer,
            filename: `bao-cao-goi-dich-vu-${queryMonth}-${queryYear}.xlsx`,
        };
    }
}
