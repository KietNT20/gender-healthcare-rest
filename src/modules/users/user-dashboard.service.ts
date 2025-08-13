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
        // Statistic total customers
        const totalCustomers = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CUSTOMER,
                },
                deletedAt: IsNull(),
            },
        });

        // Statistic active customers
        const activeCustomers = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CUSTOMER,
                },
                isActive: true,
                deletedAt: IsNull(),
            },
        });

        // Statistic new customers in current month
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
        // Statistic total consultants
        const totalConsultants = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                deletedAt: IsNull(),
            },
        });

        // Statistic active consultants
        const activeConsultants = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                isActive: true,
                deletedAt: IsNull(),
            },
        });

        // Statistic consultants with profile
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

        // Statistic total users
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
     * Statistic customer by period
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
     * Statistic consultant by period
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
     * Statistic user by gender
     */
    async getUserStatsByGender(): Promise<{
        customers: { male: number; female: number; unspecified: number };
        consultants: { male: number; female: number; unspecified: number };
    }> {
        // Statistic customer by gender
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

        // Statistic consultant by gender
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
     * Statistic user registration by 12 months
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
     * Statistic user active by period (month, quarter, year)
     * @param periodType - Period type: 'month', 'quarter', 'year'
     * @param periodCount - Number of periods to statistic (default 12)
     * @param includeCurrentPeriod - Include current period or not (default 'true')
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
                // Calculate by month
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
                // Calculate by quarter
                const currentQuarter = Math.floor(currentDate.getMonth() / 3);
                const targetQuarter = currentQuarter - i;

                let year = currentDate.getFullYear();
                let quarter = targetQuarter;

                // Handle negative quarter (previous year)
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
                // Calculate by year
                const targetYear = currentDate.getFullYear() - i;
                startDate = new Date(targetYear, 0, 1);
                endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

                label = targetYear.toString();
            }

            // Count customer active in period
            const customerCount = await this.userRepository.count({
                where: {
                    role: { name: RolesNameEnum.CUSTOMER },
                    isActive: true,
                    createdAt: Between(startDate, endDate),
                },
            });

            // Count consultant active in period
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
     * Statistic user active comparison with previous period (previous month, previous quarter, previous year)
     */
    async getUserActiveStatsComparison(
        periodType: 'month' | 'quarter' | 'year',
    ): Promise<UserActiveStatsComparison> {
        const currentDate = new Date();
        let currentStart: Date, currentEnd: Date, currentLabel: string;
        let previousStart: Date, previousEnd: Date, previousLabel: string;

        if (periodType === 'month') {
            // Current month
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

            // Previous month
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
            // Current quarter
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

            // Previous quarter
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
            // Current year
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

            // Previous year
            const prevYear = currentDate.getFullYear() - 1;
            previousStart = new Date(prevYear, 0, 1);
            previousEnd = new Date(prevYear, 11, 31, 23, 59, 59, 999);
            previousLabel = prevYear.toString();
        }

        // Statistic current period
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

        // Statistic previous period
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

        // Calculate growth
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
     * Statistic total active users by role
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
