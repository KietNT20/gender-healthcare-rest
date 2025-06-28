import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ServicePackageStatsQueryDto } from './dto/service-package-stats-query.dto';
import { ServicePackageStatsService } from './service-package-stats.service';

@Controller('service-package-stats')
export class ServicePackageStatsController {
    constructor(private readonly statsService: ServicePackageStatsService) {}

    @Get('most-subscribed')
    // @ApiBearerAuth()
    // @UseGuards(JwtAuthGuard, RoleGuard)
    // @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Get the most subscribed service package for a specific month',
    })
    @ApiResponse({
        status: 200,
        description:
            'Successfully retrieved the most subscribed service package',
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    async getMostSubscribedPackage(
        @Query() query: ServicePackageStatsQueryDto,
    ) {
        return this.statsService.getMostSubscribedPackage(query);
    }

    @Get('report')
    // @ApiBearerAuth()
    // @UseGuards(JwtAuthGuard, RoleGuard)
    // @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Generate an Excel report for all subscribed service package',
    })
    @ApiResponse({
        status: 200,
        description: 'Excel report generated successfully',
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    async generateExcelReport(
        @Query() query: ServicePackageStatsQueryDto,
        @Res() res: Response,
    ) {
        const { buffer, filename } =
            await this.statsService.generateExcelReport(query);
        res.set({
            'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        res.send(buffer);
    }
}
