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
    UseInterceptors,
} from '@nestjs/common';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStiTestProcessDto } from './dto/create-sti-test-process.dto';
import { QueryStiTestProcessDto } from './dto/query-sti-test-process.dto';
import {
    StiTestProcessListResponseDto,
    StiTestProcessResponseDto,
} from './dto/sti-test-process-response.dto';
import { UpdateStiTestProcessDto } from './dto/update-sti-test-process.dto';
import { StiTestProcessStatus } from './entities/sti-test-process.entity';
import { StiTestProcessesService } from './sti-test-processes.service';
import { StiTestWorkflowService } from './workflow/sti-test-workflow.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sti-test-processes')
export class StiTestProcessesController {
    constructor(
        private readonly stiTestProcessesService: StiTestProcessesService,
        private readonly stiTestWorkflowService: StiTestWorkflowService,
    ) {}

    @Post()
    @UseInterceptors(NoFilesInterceptor())
    @ApiConsumes('multipart/form-data')
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

    @Get()
    @ApiOperation({ summary: 'Get list of STI test processes' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of STI test processes',
        type: StiTestProcessListResponseDto,
    })
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    findAll(
        @Query() query: QueryStiTestProcessDto,
    ): Promise<StiTestProcessListResponseDto> {
        return this.stiTestProcessesService.findAll(query);
    }

    @Get('test-code/:testCode')
    @ApiOperation({ summary: 'Get STI test process by code' })
    @ApiParam({ name: 'testCode', description: 'Test code' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Information about the STI test process',
        type: StiTestProcessResponseDto,
    })
    findByTestCode(
        @Param('testCode') testCode: string,
    ): Promise<StiTestProcessResponseDto> {
        return this.stiTestProcessesService.findByTestCode(testCode);
    }

    @Get('patient/:patientId')
    @ApiOperation({
        summary: 'Get list of STI test processes by patient ID',
    })
    @ApiParam({ name: 'patientId', description: 'Patient ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of STI test processes by patient ID',
        type: StiTestProcessListResponseDto,
    })
    @ResponseMessage(
        'Get list of STI test processes by patient ID successfully',
    )
    findByPatientId(
        @Param('patientId', ParseUUIDPipe) patientId: string,
        @Query() query: QueryStiTestProcessDto,
    ): Promise<StiTestProcessListResponseDto> {
        return this.stiTestProcessesService.findByPatientId(patientId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get STI test process details' })
    @ApiParam({ name: 'id', description: 'STI test process ID' })
    @ApiResponse({
        status: HttpStatus.OK,
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
    @UseInterceptors(NoFilesInterceptor())
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Update STI test process information' })
    @ApiParam({ name: 'id', description: 'STI test process ID' })
    @ApiResponse({
        status: HttpStatus.OK,
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
    @ApiResponse({
        status: HttpStatus.OK,
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
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of workflow steps',
    })
    @ResponseMessage('Get workflow steps successfully')
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    getWorkflowSteps() {
        return this.stiTestWorkflowService.getFullWorkflow();
    }

    @Get('workflow/next-steps/:status')
    @ApiOperation({ summary: 'Get list of next workflow steps' })
    @ApiParam({ name: 'status', description: 'Current status' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of next steps',
    })
    @ResponseMessage('Get next steps successfully')
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    getNextSteps(@Param('status') status: StiTestProcessStatus) {
        return this.stiTestWorkflowService.getNextSteps(status);
    }

    @Post(':id/workflow/transition')
    @ApiOperation({ summary: 'Transition status with workflow validation' })
    @ApiParam({ name: 'id', description: 'STI test process ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Status transitioned successfully',
        type: StiTestProcessResponseDto,
    })
    @ResponseMessage('Status transitioned successfully')
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    transitionStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { newStatus: StiTestProcessStatus; validationData?: any },
    ): Promise<StiTestProcessResponseDto> {
        return this.stiTestWorkflowService.transitionStatus(
            id,
            body.newStatus,
            body.validationData,
        );
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete STI test process' })
    @ApiParam({ name: 'id', description: 'STI test process ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'STI test process deleted successfully',
    })
    @ResponseMessage('STI test process deleted successfully')
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        return this.stiTestProcessesService.remove(id);
    }
}
