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
            throw new BadRequestException('No subscription data found for the specified period');
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
     * Generate an Excel report for the most subscribed service package
     * @param query Query parameters for month and year
     * @returns Excel file buffer and filename
     */
    async generateExcelReport(query: ServicePackageStatsQueryDto) {
        const stats = await this.getMostSubscribedPackage(query);

        // Ensure package exists before accessing its properties
        if (!stats.package) {
            throw new NotFoundException('Service package data is unavailable');
        }

        // Create worksheet data
        const worksheetData = [
            ['MOST SUBSCRIBED SERVICE PACKAGE REPORT'],
            ['Month', stats.month],
            ['Year', stats.year],
            ['Package Name', stats.package.name],
            ['Subscription Count', stats.subscriptionCount],
            ['Price (VND)', stats.package.price],
            ['Duration (Months)', stats.package.durationMonths],
            ['Status', stats.package.isActive ? 'Active' : 'Inactive'],
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        // Generate Excel buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        return {
            buffer,
            filename: `service-package-report-${stats.month}-${stats.year}.xlsx`,
        };
    }
}