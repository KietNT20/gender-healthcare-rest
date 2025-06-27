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
