import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidationDataDto } from './dto';
import { CreateStiTestProcessDto } from './dto/create-sti-test-process.dto';
import { QueryStiTestProcessDto } from './dto/query-sti-test-process.dto';
import { StiTestBookingRequest } from './dto/sti-test-booking-request.dto';
import {
    StiTestProcessListResponseDto,
    StiTestProcessResponseDto,
} from './dto/sti-test-process-response.dto';
import { UpdateStiTestProcessDto } from './dto/update-sti-test-process.dto';
import { StiTestProcessStatus } from './enums';
import { StiTestIntegrationService } from './sti-test-integration.service';
import { StiTestProcessesService } from './sti-test-processes.service';
import { StiTestWorkflowService } from './workflow/sti-test-workflow.service';

@ApiTags('STIs Test Processes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sti-test-processes')
export class StiTestProcessesController {
    constructor(
        private readonly stiTestProcessesService: StiTestProcessesService,
        private readonly stiTestWorkflowService: StiTestWorkflowService,
        private readonly stiTestIntegrationService: StiTestIntegrationService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create STI Test Process' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Process created successfully',
        type: StiTestProcessResponseDto,
    })
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    create(
        @Body() createStiTestProcessDto: CreateStiTestProcessDto,
    ): Promise<StiTestProcessResponseDto> {
        return this.stiTestProcessesService.create(createStiTestProcessDto);
    }

    @Post('search')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Get list of STI test processes' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of STI test processes',
        type: StiTestProcessListResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid query parameters',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: Just admins, managers and staff can access this endpoint',
    })
    findAll(
        @Body(ValidationPipe) query: QueryStiTestProcessDto,
    ): Promise<StiTestProcessListResponseDto> {
        return this.stiTestProcessesService.findAll(query);
    }

    @Get('test-code/:testCode')
    @ApiOperation({ summary: 'Get STI test process by code' })
    @ApiParam({ name: 'testCode', description: 'Test code' })
    @ApiOkResponse({
        description: 'Information about the STI test process',
        type: StiTestProcessResponseDto,
    })
    findByTestCode(
        @Param('testCode') testCode: string,
    ): Promise<StiTestProcessResponseDto> {
        return this.stiTestProcessesService.findByTestCode(testCode);
    }

    @Post('patient/:patientId')
    @ApiOperation({
        summary: 'Get list of STI test processes by patient ID',
    })
    @ApiParam({ name: 'patientId', description: 'Patient ID' })
    @ApiOkResponse({
        description: 'List of STI test processes by patient ID',
        type: StiTestProcessListResponseDto,
    })
    @ResponseMessage(
        'Get list of STI test processes by patient ID successfully',
    )
    findByPatientId(
        @Param('patientId', ParseUUIDPipe) patientId: string,
        @Body(ValidationPipe) query: QueryStiTestProcessDto,
    ): Promise<StiTestProcessListResponseDto> {
        return this.stiTestProcessesService.findByPatientId(patientId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get STI test process details' })
    @ApiParam({ name: 'id', description: 'STI test process ID' })
    @ApiOkResponse({
        description: 'Information about the STI test process',
        type: StiTestProcessResponseDto,
    })
    @ResponseMessage('Get STI test process details successfully')
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<StiTestProcessResponseDto> {
        return this.stiTestProcessesService.findById(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update STI test process information' })
    @ApiParam({ name: 'id', description: 'STI test process ID' })
    @ApiOkResponse({
        description: 'STI test process updated successfully',
        type: StiTestProcessResponseDto,
    })
    @ResponseMessage('STI test process updated successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateStiTestProcessDto: UpdateStiTestProcessDto,
    ): Promise<StiTestProcessResponseDto> {
        return this.stiTestProcessesService.update(id, updateStiTestProcessDto);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update STI test process status' })
    @ApiParam({ name: 'id', description: 'STI test process ID' })
    @ApiQuery({
        name: 'status',
        description: 'New status',
        enum: StiTestProcessStatus,
    })
    @ApiOkResponse({
        description: 'Status updated successfully',
        type: StiTestProcessResponseDto,
    })
    @ResponseMessage('STI test process status updated successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('status') status: StiTestProcessStatus,
    ): Promise<StiTestProcessResponseDto> {
        return this.stiTestProcessesService.updateStatus(id, status);
    }

    @Get('workflow/steps')
    @ApiOperation({ summary: 'Get list of workflow steps' })
    @ApiOkResponse({
        description: 'List of workflow steps',
    })
    @ResponseMessage('Get workflow steps successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    getWorkflowSteps() {
        return this.stiTestWorkflowService.getFullWorkflow();
    }

    @Get('workflow/next-steps/:status')
    @ApiOperation({ summary: 'Get list of next workflow steps' })
    @ApiParam({ name: 'status', description: 'Current status' })
    @ApiOkResponse({
        description: 'List of next steps',
    })
    @ResponseMessage('Get next steps successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    getNextSteps(@Param('status') status: StiTestProcessStatus) {
        return this.stiTestWorkflowService.getNextSteps(status);
    }

    @Post(':id/workflow/transition')
    @ApiOperation({ summary: 'Transition status with workflow validation' })
    @ApiParam({ name: 'id', description: 'STI test process ID' })
    @ApiOkResponse({
        description: 'Status transitioned successfully',
        type: StiTestProcessResponseDto,
    })
    @ResponseMessage('Status transitioned successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    transitionStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body()
        body: {
            newStatus: StiTestProcessStatus;
            validationData?: ValidationDataDto;
        },
    ): Promise<StiTestProcessResponseDto> {
        return this.stiTestWorkflowService.transitionStatus(
            id,
            body.newStatus,
            body.validationData,
        );
    }

    @Post('booking/from-service-selection')
    @ApiOperation({ summary: 'Create STI test process from service selection' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'STI test process created from service selection',
    })
    @ResponseMessage(
        'STI test process created from service selection successfully',
    )
    @UseGuards(RoleGuard)
    @Roles([
        RolesNameEnum.CUSTOMER,
        RolesNameEnum.STAFF,
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
    ])
    async createFromServiceSelection(@Body() request: StiTestBookingRequest) {
        return this.stiTestIntegrationService.createStiTestFromServiceSelection(
            request,
        );
    }

    @Get('services/available')
    @ApiOperation({ summary: 'Get available STI test services' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of available STI test services',
    })
    @ResponseMessage('Get available STI services successfully')
    @UseGuards(RoleGuard)
    @Roles([
        RolesNameEnum.CUSTOMER,
        RolesNameEnum.STAFF,
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
    ])
    async getAvailableStiServices() {
        return this.stiTestIntegrationService.getAvailableStiServices();
    }

    @Get('services/package/:packageId')
    @ApiOperation({ summary: 'Get STI services from package' })
    @ApiParam({ name: 'packageId', description: 'Service package ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'STI services from package',
    })
    @ResponseMessage('Get STI services from package successfully')
    @UseGuards(RoleGuard)
    @Roles([
        RolesNameEnum.CUSTOMER,
        RolesNameEnum.STAFF,
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
    ])
    async getStiServicesFromPackage(
        @Param('packageId', ParseUUIDPipe) packageId: string,
    ) {
        return this.stiTestIntegrationService.getStiServicesFromPackage(
            packageId,
        );
    }

    @Get('statistics/dashboard')
    @ApiOperation({ summary: 'Get STI test process statistics for dashboard' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'STI test process statistics',
    })
    @ResponseMessage('Get STI test statistics successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    async getStatistics() {
        const processes =
            await this.stiTestProcessesService.findAllForStatistics();
        return this.stiTestWorkflowService.getWorkflowStatistics(processes);
    }

    @Get('statistics/period')
    @ApiOperation({ summary: 'Get STI test process statistics by period' })
    @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'STI test process statistics by period',
    })
    @ResponseMessage('Get STI test statistics by period successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    async getStatisticsByPeriod(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const processes =
            await this.stiTestProcessesService.findAllForStatisticsByPeriod(
                start,
                end,
            );
        return this.stiTestWorkflowService.getWorkflowStatistics(processes);
    }

    @Get('statistics/patient/:patientId')
    @ApiOperation({
        summary: 'Get STI test process statistics for specific patient',
    })
    @ApiParam({ name: 'patientId', description: 'Patient ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'STI test process statistics for patient',
    })
    @ResponseMessage('Get STI test statistics for patient successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    async getPatientStatistics(
        @Param('patientId', ParseUUIDPipe) patientId: string,
    ) {
        const processes =
            await this.stiTestProcessesService.findAllForStatisticsByPatient(
                patientId,
            );
        return this.stiTestWorkflowService.getWorkflowStatistics(processes);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete STI test process' })
    @ApiParam({ name: 'id', description: 'STI test process ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'STI test process deleted successfully',
    })
    @ResponseMessage('STI test process deleted successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        return this.stiTestProcessesService.remove(id);
    }
}
