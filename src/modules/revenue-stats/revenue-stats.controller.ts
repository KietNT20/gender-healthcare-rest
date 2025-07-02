import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RevenueStatsService } from './revenue-stats.service';

@ApiTags('Revenue Stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
@Controller('revenue-stats')
export class RevenueStatsController {
    constructor(private readonly revenueStatsService: RevenueStatsService) {}

    @Get('monthly')
    @ApiOperation({ summary: 'Get monthly revenue statistics' })
    @ApiResponse({
        status: 200,
        description: 'Monthly revenue retrieved successfully',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin or Manager can access',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid year or month parameter',
    })
    @ResponseMessage('Monthly revenue retrieved successfully')
    getMonthlyRevenueStats(
        @Query('year') year?: number,
        @Query('month') month?: number,
    ) {
        return this.revenueStatsService.getMonthlyRevenueStats(year, month);
    }

    @Get('yearly')
    @ApiOperation({
        summary: 'Get yearly revenue statistics with monthly breakdown',
    })
    @ApiResponse({
        status: 200,
        description:
            'Yearly revenue with monthly breakdown retrieved successfully',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin or Manager can access',
    })
    @ApiResponse({ status: 400, description: 'Invalid year parameter' })
    @ResponseMessage(
        'Yearly revenue with monthly breakdown retrieved successfully',
    )
    getYearlyRevenueStats(@Query('year') year?: number) {
        return this.revenueStatsService.getYearlyRevenueStats(year);
    }

    @Get('report')
    @ApiOperation({
        summary: 'Generate an Excel report for revenue statistics',
    })
    @ApiResponse({
        status: 200,
        description: 'Excel report generated successfully',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin or Manager can access',
    })
    @ApiResponse({ status: 400, description: 'Invalid year parameter' })
    @ResponseMessage('Excel report generated successfully')
    async generateExcelReport(
        @Res() res: Response,
        @Query('year') year?: number,
    ) {
        const buffer = await this.revenueStatsService.exportRevenueStats(year);
        res.set({
            'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="revenue-report-${year || new Date().getFullYear()}.xlsx"`,
        });
        res.send(buffer);
    }
}
