import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServicePackagesStatsQueryDto } from './dto/service-packages-stats-query.dto';
import { ServicePackagesStatsService } from './service-packages-stats.service';

@ApiTags('Service Packages Stats')
@Controller('service-package-stats')
export class ServicePackagesStatsController {
    constructor(private readonly statsService: ServicePackagesStatsService) {}

    @Get('most-subscribed')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
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
        @Query() query: ServicePackagesStatsQueryDto,
    ) {
        return this.statsService.getMostSubscribedPackage(query);
    }

    @Get('all-stats')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Get statistics for all service packages in a specific month',
    })
    @ApiResponse({
        status: 200,
        description:
            'Successfully retrieved statistics for all service packages',
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    async getAllPackageStats(@Query() query: ServicePackagesStatsQueryDto) {
        return this.statsService.getAllPackageStats(query);
    }

    @Get('report')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Generate an Excel report for all subscribed service package',
    })
    @ApiResponse({
        status: 200,
        description: 'Excel report generated successfully',
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    async generateExcelReport(
        @Query() query: ServicePackagesStatsQueryDto,
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