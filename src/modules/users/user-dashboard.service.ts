import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GenderType, RolesNameEnum } from 'src/enums';
import { Between, IsNull, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {
    ConsultantDashboardStats,
    CustomerDashboardStats,
    DashboardOverview,
    TotalActiveUsersByRole,
    UserActiveStatsComparison,
    UserActiveStatsPeriod,
} from './interfaces/user-dashboard.interface';

@Injectable()
export class UserDashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async getCustomerDashboard(): Promise<CustomerDashboardStats> {
        // Thống kê tổng số customer đã đăng ký
        const totalCustomers = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CUSTOMER,
                },
                deletedAt: IsNull(),
            },
        });

        // Thống kê customer đang active
        const activeCustomers = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CUSTOMER,
                },
                isActive: true,
                deletedAt: IsNull(),
            },
        });

        // Thống kê customer theo tháng (đăng ký mới trong tháng hiện tại)
        const currentDate = new Date();
        const startOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1,
        );
        const endOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
        );

        const newCustomersThisMonth = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CUSTOMER,
                },
                createdAt: Between(startOfMonth, endOfMonth),
                deletedAt: IsNull(),
            },
        });

        return {
            totalCustomers,
            activeCustomers,
            inactiveCustomers: totalCustomers - activeCustomers,
            newCustomersThisMonth,
        };
    }

    async getConsultantDashboard(): Promise<ConsultantDashboardStats> {
        // Thống kê tổng số consultant
        const totalConsultants = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                deletedAt: IsNull(),
            },
        });

        // Thống kê consultant đang active
        const activeConsultants = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                isActive: true,
                deletedAt: IsNull(),
            },
        });

        // Thống kê consultant có profile đầy đủ
        const consultantsWithProfile = await this.userRepository.count({
            relations: {
                consultantProfile: true,
            },
            where: {
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                deletedAt: IsNull(),
            },
        });

        return {
            totalConsultants,
            activeConsultants,
            inactiveConsultants: totalConsultants - activeConsultants,
            consultantsWithProfile,
        };
    }

    async getDashboardOverview(): Promise<DashboardOverview> {
        const customerStats = await this.getCustomerDashboard();
        const consultantStats = await this.getConsultantDashboard();

        // Thống kê tổng quan
        const totalUsers = await this.userRepository.count();
        const totalActiveUsers = await this.userRepository.count({
            where: {
                isActive: true,
            },
        });

        return {
            overview: {
                totalUsers,
                totalActiveUsers,
                totalInactiveUsers: totalUsers - totalActiveUsers,
            },
            customers: customerStats,
            consultants: consultantStats,
        };
    }

    /**
     * Thống kê customer theo khoảng thời gian tùy chọn
     */
    async getCustomerStatsByPeriod(
        startDate: Date,
        endDate: Date,
    ): Promise<{
        registeredInPeriod: number;
        activeInPeriod: number;
    }> {
        const registeredInPeriod = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CUSTOMER,
                },
                createdAt: Between(startDate, endDate),
            },
        });

        const activeInPeriod = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CUSTOMER,
                },
                isActive: true,
                createdAt: Between(startDate, endDate),
            },
        });

        return {
            registeredInPeriod,
            activeInPeriod,
        };
    }

    /**
     * Thống kê consultant theo khoảng thời gian tùy chọn
     */
    async getConsultantStatsByPeriod(
        startDate: Date,
        endDate: Date,
    ): Promise<{
        registeredInPeriod: number;
        activeInPeriod: number;
        withProfileInPeriod: number;
    }> {
        const registeredInPeriod = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                createdAt: Between(startDate, endDate),
            },
        });

        const activeInPeriod = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                isActive: true,
                createdAt: Between(startDate, endDate),
            },
        });

        const withProfileInPeriod = await this.userRepository.count({
            relations: {
                consultantProfile: true,
            },
            where: {
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                consultantProfile: Not(IsNull()),
                createdAt: Between(startDate, endDate),
            },
        });

        return {
            registeredInPeriod,
            activeInPeriod,
            withProfileInPeriod,
        };
    }

    /**
     * Thống kê user theo giới tính
     */
    async getUserStatsByGender(): Promise<{
        customers: { male: number; female: number; unspecified: number };
        consultants: { male: number; female: number; unspecified: number };
    }> {
        // Customer stats by gender
        const customerMale = await this.userRepository.count({
            where: {
                role: { name: RolesNameEnum.CUSTOMER },
                gender: GenderType.MALE,
            },
        });

        const customerFemale = await this.userRepository.count({
            where: {
                role: { name: RolesNameEnum.CUSTOMER },
                gender: GenderType.FEMALE,
            },
        });

        const customerUnspecified = await this.userRepository.count({
            where: {
                role: { name: RolesNameEnum.CUSTOMER },
                gender: IsNull(),
            },
        });

        // Consultant stats by gender
        const consultantMale = await this.userRepository.count({
            where: {
                role: { name: RolesNameEnum.CONSULTANT },
                gender: GenderType.MALE,
            },
        });

        const consultantFemale = await this.userRepository.count({
            where: {
                role: { name: RolesNameEnum.CONSULTANT },
                gender: GenderType.FEMALE,
            },
        });

        const consultantUnspecified = await this.userRepository.count({
            where: {
                role: { name: RolesNameEnum.CONSULTANT },
                gender: IsNull(),
            },
        });

        return {
            customers: {
                male: customerMale,
                female: customerFemale,
                unspecified: customerUnspecified,
            },
            consultants: {
                male: consultantMale,
                female: consultantFemale,
                unspecified: consultantUnspecified,
            },
        };
    }

    /**
     * Thống kê user đăng ký theo 12 tháng gần nhất
     */
    async getUserRegistrationTrend(): Promise<{
        customers: Array<{ month: string; count: number }>;
        consultants: Array<{ month: string; count: number }>;
    }> {
        const customerTrend: Array<{ month: string; count: number }> = [];
        const consultantTrend: Array<{ month: string; count: number }> = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const startOfMonth = new Date(
                date.getFullYear(),
                date.getMonth(),
                1,
            );
            const endOfMonth = new Date(
                date.getFullYear(),
                date.getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
            );

            const customerCount = await this.userRepository.count({
                where: {
                    role: { name: RolesNameEnum.CUSTOMER },
                    createdAt: Between(startOfMonth, endOfMonth),
                },
            });

            const consultantCount = await this.userRepository.count({
                where: {
                    role: { name: RolesNameEnum.CONSULTANT },
                    createdAt: Between(startOfMonth, endOfMonth),
                },
            });

            const monthName = date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
            });

            customerTrend.push({ month: monthName, count: customerCount });
            consultantTrend.push({ month: monthName, count: consultantCount });
        }

        return {
            customers: customerTrend,
            consultants: consultantTrend,
        };
    }

    /**
     * Thống kê user active theo khoảng thời gian (tháng, quý, năm)
     * @param periodType - Loại khoảng thời gian: 'month', 'quarter', 'year'
     * @param periodCount - Số lượng khoảng thời gian cần thống kê (mặc định 12)
     * @param includeCurrentPeriod - Có bao gồm khoảng thời gian hiện tại hay không (mặc định 'true')
     * @returns Promise<UserActiveStatsPeriod[]>
     */
    async getUserActiveStatsByPeriod(
        periodType: 'month' | 'quarter' | 'year',
        periodCount: number = 12,
        includeCurrentPeriod: string = 'true',
    ): Promise<UserActiveStatsPeriod[]> {
        const stats: UserActiveStatsPeriod[] = [];
        const currentDate = new Date();

        for (
            let i = includeCurrentPeriod === 'true' ? 0 : 1;
            i < periodCount + (includeCurrentPeriod === 'true' ? 0 : 1);
            i++
        ) {
            let startDate: Date;
            let endDate: Date;
            let label: string;

            if (periodType === 'month') {
                // Tính theo tháng
                const targetDate = new Date(currentDate);
                targetDate.setMonth(currentDate.getMonth() - i);

                startDate = new Date(
                    targetDate.getFullYear(),
                    targetDate.getMonth(),
                    1,
                );
                endDate = new Date(
                    targetDate.getFullYear(),
                    targetDate.getMonth() + 1,
                    0,
                    23,
                    59,
                    59,
                    999,
                );

                label = targetDate.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                });
            } else if (periodType === 'quarter') {
                // Tính theo quý
                const targetDate = new Date(currentDate);
                const currentQuarter = Math.floor(currentDate.getMonth() / 3);
                const targetQuarter = currentQuarter - i;

                let year = currentDate.getFullYear();
                let quarter = targetQuarter;

                // Xử lý khi quý âm (sang năm trước)
                while (quarter < 0) {
                    quarter += 4;
                    year -= 1;
                }

                const quarterStartMonth = quarter * 3;
                startDate = new Date(year, quarterStartMonth, 1);
                endDate = new Date(
                    year,
                    quarterStartMonth + 3,
                    0,
                    23,
                    59,
                    59,
                    999,
                );

                label = `Q${quarter + 1}/${year}`;
            } else {
                // Tính theo năm
                const targetYear = currentDate.getFullYear() - i;
                startDate = new Date(targetYear, 0, 1);
                endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

                label = targetYear.toString();
            }

            // Đếm customer active trong khoảng thời gian
            const customerCount = await this.userRepository.count({
                where: {
                    role: { name: RolesNameEnum.CUSTOMER },
                    isActive: true,
                    createdAt: Between(startDate, endDate),
                },
            });

            // Đếm consultant active trong khoảng thời gian
            const consultantCount = await this.userRepository.count({
                where: {
                    role: { name: RolesNameEnum.CONSULTANT },
                    isActive: true,
                    createdAt: Between(startDate, endDate),
                },
            });

            stats.unshift({
                month: label,
                customer: customerCount,
                consultant: consultantCount,
            });
        }

        return stats;
    }

    /**
     * Thống kê user active so sánh với kỳ trước (tháng trước, quý trước, năm trước)
     */
    async getUserActiveStatsComparison(
        periodType: 'month' | 'quarter' | 'year',
    ): Promise<UserActiveStatsComparison> {
        const currentDate = new Date();
        let currentStart: Date, currentEnd: Date, currentLabel: string;
        let previousStart: Date, previousEnd: Date, previousLabel: string;

        if (periodType === 'month') {
            // Tháng hiện tại
            currentStart = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1,
            );
            currentEnd = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
            );
            currentLabel = currentDate.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
            });

            // Tháng trước
            const prevMonth = new Date(currentDate);
            prevMonth.setMonth(currentDate.getMonth() - 1);
            previousStart = new Date(
                prevMonth.getFullYear(),
                prevMonth.getMonth(),
                1,
            );
            previousEnd = new Date(
                prevMonth.getFullYear(),
                prevMonth.getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
            );
            previousLabel = prevMonth.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
            });
        } else if (periodType === 'quarter') {
            // Quý hiện tại
            const currentQuarter = Math.floor(currentDate.getMonth() / 3);
            const currentQuarterStartMonth = currentQuarter * 3;
            currentStart = new Date(
                currentDate.getFullYear(),
                currentQuarterStartMonth,
                1,
            );
            currentEnd = new Date(
                currentDate.getFullYear(),
                currentQuarterStartMonth + 3,
                0,
                23,
                59,
                59,
                999,
            );
            currentLabel = `Q${currentQuarter + 1}/${currentDate.getFullYear()}`;

            // Quý trước
            let prevQuarter = currentQuarter - 1;
            let prevYear = currentDate.getFullYear();
            if (prevQuarter < 0) {
                prevQuarter = 3;
                prevYear -= 1;
            }
            const prevQuarterStartMonth = prevQuarter * 3;
            previousStart = new Date(prevYear, prevQuarterStartMonth, 1);
            previousEnd = new Date(
                prevYear,
                prevQuarterStartMonth + 3,
                0,
                23,
                59,
                59,
                999,
            );
            previousLabel = `Q${prevQuarter + 1}/${prevYear}`;
        } else {
            // Năm hiện tại
            currentStart = new Date(currentDate.getFullYear(), 0, 1);
            currentEnd = new Date(
                currentDate.getFullYear(),
                11,
                31,
                23,
                59,
                59,
                999,
            );
            currentLabel = currentDate.getFullYear().toString();

            // Năm trước
            const prevYear = currentDate.getFullYear() - 1;
            previousStart = new Date(prevYear, 0, 1);
            previousEnd = new Date(prevYear, 11, 31, 23, 59, 59, 999);
            previousLabel = prevYear.toString();
        }

        // Thống kê kỳ hiện tại
        const [currentCustomers, currentConsultants] = await Promise.all([
            this.userRepository.count({
                where: {
                    role: { name: RolesNameEnum.CUSTOMER },
                    isActive: true,
                    createdAt: Between(currentStart, currentEnd),
                },
            }),
            this.userRepository.count({
                where: {
                    role: { name: RolesNameEnum.CONSULTANT },
                    isActive: true,
                    createdAt: Between(currentStart, currentEnd),
                },
            }),
        ]);

        // Thống kê kỳ trước
        const [previousCustomers, previousConsultants] = await Promise.all([
            this.userRepository.count({
                where: {
                    role: { name: RolesNameEnum.CUSTOMER },
                    isActive: true,
                    createdAt: Between(previousStart, previousEnd),
                },
            }),
            this.userRepository.count({
                where: {
                    role: { name: RolesNameEnum.CONSULTANT },
                    isActive: true,
                    createdAt: Between(previousStart, previousEnd),
                },
            }),
        ]);

        // Tính toán tăng trưởng
        const customerGrowth = currentCustomers - previousCustomers;
        const consultantGrowth = currentConsultants - previousConsultants;
        const customerGrowthPercent =
            previousCustomers > 0
                ? Math.round((customerGrowth / previousCustomers) * 100 * 100) /
                  100
                : 0;
        const consultantGrowthPercent =
            previousConsultants > 0
                ? Math.round(
                      (consultantGrowth / previousConsultants) * 100 * 100,
                  ) / 100
                : 0;

        return {
            current: {
                month: currentLabel,
                customer: currentCustomers,
                consultant: currentConsultants,
            },
            previous: {
                month: previousLabel,
                customer: previousCustomers,
                consultant: previousConsultants,
            },
            growth: {
                customer: customerGrowth,
                consultant: consultantGrowth,
                customerPercent: customerGrowthPercent,
                consultantPercent: consultantGrowthPercent,
            },
        };
    }

    /**
     * Thống kê tổng user active hiện tại theo role
     */
    async getTotalActiveUsersByRole(): Promise<TotalActiveUsersByRole> {
        const [customers, consultants, staff, managers, admins] =
            await Promise.all([
                this.userRepository.count({
                    where: {
                        role: { name: RolesNameEnum.CUSTOMER },
                        isActive: true,
                    },
                }),
                this.userRepository.count({
                    where: {
                        role: { name: RolesNameEnum.CONSULTANT },
                        isActive: true,
                    },
                }),
                this.userRepository.count({
                    where: {
                        role: { name: RolesNameEnum.STAFF },
                        isActive: true,
                    },
                }),
                this.userRepository.count({
                    where: {
                        role: { name: RolesNameEnum.MANAGER },
                        isActive: true,
                    },
                }),
                this.userRepository.count({
                    where: {
                        role: { name: RolesNameEnum.ADMIN },
                        isActive: true,
                    },
                }),
            ]);

        return {
            customers,
            consultants,
            staff,
            managers,
            admins,
            total: customers + consultants + staff + managers + admins,
        };
    }
}
