export interface CustomerDashboardStats {
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    newCustomersThisMonth: number;
}

export interface ConsultantDashboardStats {
    totalConsultants: number;
    activeConsultants: number;
    inactiveConsultants: number;
    consultantsWithProfile: number;
}

export interface OverviewStats {
    totalUsers: number;
    totalActiveUsers: number;
    totalInactiveUsers: number;
}

export interface DashboardOverview {
    overview: OverviewStats;
    customers: CustomerDashboardStats;
    consultants: ConsultantDashboardStats;
}

export interface UserActiveStatsPeriod {
    month: string;
    customer: number;
    consultant: number;
}

export interface UserActiveStatsComparison {
    current: UserActiveStatsPeriod;
    previous: UserActiveStatsPeriod;
    growth: {
        customer: number;
        consultant: number;
        customerPercent: number;
        consultantPercent: number;
    };
}

export interface TotalActiveUsersByRole {
    customers: number;
    consultants: number;
    staff: number;
    managers: number;
    admins: number;
    total: number;
}
