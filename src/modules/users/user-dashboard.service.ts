import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GenderType, RolesNameEnum } from 'src/enums';
import { Between, IsNull, Not, Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { User } from './entities/user.entity';
import {
    ConsultantDashboardStats,
    CustomerDashboardStats,
    DashboardOverview,
} from './interfaces/user-dashboard.interface';

@Injectable()
export class UserDashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {}

    async getCustomerDashboard(): Promise<CustomerDashboardStats> {
        // Thống kê tổng số customer đã đăng ký
        const totalCustomers = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CUSTOMER,
                },
            },
        });

        // Thống kê customer đang active
        const activeCustomers = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CUSTOMER,
                },
                isActive: true,
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
            },
        });

        // Thống kê consultant đang active
        const activeConsultants = await this.userRepository.count({
            where: {
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                isActive: true,
            },
        });

        // Thống kê consultant có profile đầy đủ
        const consultantsWithProfile = await this.userRepository.count({
            relations: ['consultantProfile'],
            where: {
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                consultantProfile: Not(IsNull()),
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
            relations: ['consultantProfile'],
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
}
