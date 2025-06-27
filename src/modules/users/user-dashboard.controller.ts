import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
    PeriodStatsDto,
    UserActiveStatsComparisonDto,
    UserActiveStatsPeriodDto,
} from './dto/user-dashboard.dto';
import { UserDashboardService } from './user-dashboard.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
@Controller('user-dashboard')
export class UserDashboardController {
    constructor(private readonly userDashboardService: UserDashboardService) {}

    @Get('overview')
    async getDashboardOverview() {
        return this.userDashboardService.getDashboardOverview();
    }

    @Get('customers')
    async getCustomerDashboard() {
        return this.userDashboardService.getCustomerDashboard();
    }

    @Get('consultants')
    async getConsultantDashboard() {
        return this.userDashboardService.getConsultantDashboard();
    }

    @Get('customers/period')
    async getCustomerStatsByPeriod(@Query() query: PeriodStatsDto) {
        return this.userDashboardService.getCustomerStatsByPeriod(
            query.startDate,
            query.endDate,
        );
    }

    @Get('consultants/period')
    async getConsultantStatsByPeriod(@Query() query: PeriodStatsDto) {
        return this.userDashboardService.getConsultantStatsByPeriod(
            query.startDate,
            query.endDate,
        );
    }

    @Get('stats/gender')
    async getUserStatsByGender() {
        return this.userDashboardService.getUserStatsByGender();
    }

    @Get('stats/registration-trend')
    async getUserRegistrationTrend() {
        return this.userDashboardService.getUserRegistrationTrend();
    }

    @Get('stats/active-by-period')
    async getUserActiveStatsByPeriod(@Query() query: UserActiveStatsPeriodDto) {
        return this.userDashboardService.getUserActiveStatsByPeriod(
            query.periodType || 'month',
            query.periodCount || 12,
            query.includeCurrentPeriod ?? 'true',
        );
    }

    @Get('stats/active-comparison')
    async getUserActiveStatsComparison(
        @Query() query: UserActiveStatsComparisonDto,
    ) {
        return this.userDashboardService.getUserActiveStatsComparison(
            query.periodType || 'month',
        );
    }

    @Get('stats/total-active-by-role')
    async getTotalActiveUsersByRole() {
        return this.userDashboardService.getTotalActiveUsersByRole();
    }
}
