import { Controller, Get, HttpStatus, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiProduces,
} from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { RolesNameEnum } from 'src/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { MonthlyRevenueReportDto } from './dto/monthly-revenue-report.dto';
import { RevenueReportsService } from './revenue-reports.service';

@Controller('revenue-reports')
export class RevenueReportsController {
    constructor(private readonly revenueReportsService: RevenueReportsService) {}

    @Get('monthly')
    // @ApiBearerAuth()
    // @UseGuards(JwtAuthGuard, RoleGuard)
    // @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Get monthly revenue report',
        description: 'Xem thống kê doanh thu hàng tháng dưới dạng JSON - chỉ dành cho admin, manager',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Monthly revenue report retrieved successfully',
        type: [Object], // Định nghĩa kiểu trả về là mảng object
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Forbidden access - admin or manager only',
    })
    @ResponseMessage('Lấy danh sách doanh thu hàng tháng thành công')
    async getMonthlyRevenueReport(@Query() query: MonthlyRevenueReportDto) {
        return this.revenueReportsService.getMonthlyRevenueData(query);
    }

    @Get('monthly/export')
    // @ApiBearerAuth()
    // @UseGuards(JwtAuthGuard, RoleGuard)
    // @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Export monthly revenue report to Excel',
        description: 'Tải báo cáo doanh thu hàng tháng dưới dạng file Excel - chỉ dành cho admin, manager',
    })
    @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Monthly revenue report exported successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Forbidden access - admin or manager only',
    })
    @ResponseMessage('Tạo báo cáo doanh thu Excel thành công')
    async exportMonthlyRevenueReport(
        @Query() query: MonthlyRevenueReportDto,
        @Res() res: Response,
    ) {
        const buffer = await this.revenueReportsService.generateMonthlyRevenueReport(query);
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="monthly_revenue_report_${new Date().toISOString().split('T')[0]}.xlsx"`,
        });
        return res.send(buffer);
    }
}