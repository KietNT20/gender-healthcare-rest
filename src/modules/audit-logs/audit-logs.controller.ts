import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('audit-logs')
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) {}

    @Get()
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Get all audit logs with filtering and pagination',
    })
    @ResponseMessage('Audit logs retrieved successfully.')
    findAll(@Query() queryDto: QueryAuditLogDto) {
        return this.auditLogsService.findAll(queryDto);
    }

    @Get(':id')
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Get a single audit log by ID' })
    @ResponseMessage('Audit log retrieved successfully.')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.auditLogsService.findOne(id);
    }

    @Patch(':id')
    @Roles([RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Update an audit log (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Audit log updated successfully.',
    })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ResponseMessage('Audit log updated successfully.')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateAuditLogDto: UpdateAuditLogDto,
    ) {
        return this.auditLogsService.update(id, updateAuditLogDto);
    }

    @Delete(':id')
    @Roles([RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Delete an audit log (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Audit log deleted successfully.',
    })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ResponseMessage('Audit log deleted successfully.')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.auditLogsService.remove(id);
    }
}
