import { Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RevenueStatsService } from './revenue-stats.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { StreamableFile } from '@nestjs/common';

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

    @Get('report')
    @ApiOperation({ summary: 'Lấy báo cáo doanh thu để tải về' })
    @ApiResponse({
        status: 200,
        description: 'Báo cáo đã được tạo thành công',
        content: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 403, description: 'Cấm truy cập: Chỉ Admin hoặc Manager có quyền truy cập' })
    @ApiResponse({ status: 400, description: 'Tham số năm không hợp lệ' })
    @ResponseMessage('Báo cáo doanh thu được tạo thành công')
    async getRevenueReport(
        @Query('year', ValidationPipe) year: number,
    ): Promise<StreamableFile> {
        const { buffer, filename } = await this.revenueStatsService.generateRevenueReport(year);

        // Trả về file dưới dạng StreamableFile để Swagger có thể nhận diện là file tải về
        return new StreamableFile(buffer, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            disposition: `attachment; filename="${filename}"`, // Đặt tên file khi tải về
        });
    }
}

