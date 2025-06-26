import { Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RevenueStatsService } from './revenue-stats.service';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@ApiTags('Revenue Stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
@Controller('revenue-stats')
export class RevenueStatsController {
    constructor(private readonly revenueStatsService: RevenueStatsService) {}

    @Get('monthly')
    @ApiOperation({ summary: 'Get monthly revenue statistics' })
    @ApiResponse({ status: 200, description: 'Monthly revenue retrieved successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can access' })
    @ApiResponse({ status: 400, description: 'Invalid year or month parameter' })
    @ResponseMessage('Monthly revenue retrieved successfully')
    getMonthlyRevenueStats(
        @Query('year') year?: number,
        @Query('month') month?: number,
    ) {
        return this.revenueStatsService.getMonthlyRevenueStats(year, month);
    }

    @Get('yearly')
    @ApiOperation({ summary: 'Get yearly revenue statistics with monthly breakdown' })
    @ApiResponse({ status: 200, description: 'Yearly revenue with monthly breakdown retrieved successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can access' })
    @ApiResponse({ status: 400, description: 'Invalid year parameter' })
    @ResponseMessage('Yearly revenue with monthly breakdown retrieved successfully')
    getYearlyRevenueStats(
        @Query('year') year?: number,
    ) {
        return this.revenueStatsService.getYearlyRevenueStats(year);
    }

}