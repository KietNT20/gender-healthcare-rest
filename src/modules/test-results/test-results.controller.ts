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
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiForbiddenResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';
import {
    CreateTestResultDto,
    CreateTestResultWithFileDto,
} from './dto/create-test-result.dto';
import { TestResultDataDto } from './dto/test-result-data.dto';
import {
    RecommendationsResponseDto,
    TestResultResponseDto,
    TestResultTemplateResponseDto,
    ValidationResponseDto,
} from './dto/test-result-response.dto';
import { UpdateTestResultDto } from './dto/update-test-result.dto';
import { ServiceType } from './enums/test-result.enums';
import { TestResultExportPdfService } from './services/test-result-export-pdf.service';
import { TestResultTemplateService } from './services/test-result-template.service';
import { TestResultsService } from './test-results.service';

@ApiTags('Test Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('test-results')
export class TestResultsController {
    constructor(
        private readonly testResultsService: TestResultsService,
        private readonly testResultTemplateService: TestResultTemplateService,
        private readonly testResultExportPdfService: TestResultExportPdfService,
    ) {}

    // Template endpoints
    @Get('templates/:serviceType')
    @ApiOperation({
        summary: 'Get test result template by service type',
        description:
            'Lấy template chuẩn cho từng loại dịch vụ y tế để frontend sử dụng',
    })
    @ApiParam({
        name: 'serviceType',
        enum: ServiceType,
        description: 'Type of medical service',
    })
    getTemplate(
        @Param('serviceType') serviceType: ServiceType,
    ): TestResultTemplateResponseDto {
        const template =
            this.testResultTemplateService.getTemplateByServiceType(
                serviceType,
            );
        return {
            template,
            metadata: {
                serviceType,
                version: '1.0.0',
                lastUpdated: new Date(),
                requiredFields: [
                    'serviceType',
                    'testName',
                    'results',
                    'overallStatus',
                ],
                optionalFields: [
                    'testCode',
                    'sampleInfo',
                    'summary',
                    'recommendations',
                ],
            },
        };
    }

    @Post('validate')
    @ApiOperation({
        summary: 'Validate test result data against template',
        description: 'Validate dữ liệu test result theo chuẩn định sẵn',
    })
    validateResultData(
        @Body() resultData: TestResultDataDto,
    ): ValidationResponseDto {
        return this.testResultTemplateService.validateResultData(resultData);
    }

    @Post('recommendations')
    @ApiOperation({
        summary: 'Generate recommendations based on test results',
        description: 'Sinh khuyến nghị tự động dựa trên kết quả xét nghiệm',
    })
    generateRecommendations(
        @Body() resultData: TestResultDataDto,
    ): RecommendationsResponseDto {
        const recommendations =
            this.testResultTemplateService.generateRecommendations(resultData);

        // Determine priority based on results
        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
        const hasAbnormal = resultData.results?.some(
            (r) => r.status === 'abnormal',
        );
        const hasCritical = resultData.results?.some(
            (r) => r.status === 'critical',
        );

        if (hasCritical) {
            priority = 'critical';
        } else if (hasAbnormal) {
            priority =
                resultData.overallStatus === 'critical' ? 'high' : 'medium';
        }

        return {
            recommendations,
            priority,
            notes:
                recommendations.length > 0
                    ? 'Vui lòng thực hiện theo khuyến nghị'
                    : 'Kết quả bình thường',
        };
    }

    // Regular test result endpoints
    @Post()
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.STAFF])
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Create a new test result with file upload',
        description:
            'Support both online booking (with appointmentId) and walk-in (with patientId + serviceId)',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        type: CreateTestResultWithFileDto,
    })
    @ApiForbiddenResponse({
        description: 'Forbidden: Admin or Staff role required.',
    })
    @ResponseMessage('Test result created successfully.')
    create(
        @Body() createTestResultDto: CreateTestResultDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.testResultsService.create(createTestResultDto, file);
    }

    @Get('appointment/:appointmentId')
    @ApiOperation({ summary: 'Get test result by appointment ID' })
    findByAppointmentId(
        @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
        @CurrentUser() user: User,
    ) {
        return this.testResultsService.findByAppointmentId(appointmentId, user);
    }

    @Get()
    @ApiOperation({ summary: 'Get all test results' })
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.STAFF])
    findAll() {
        return this.testResultsService.findAll();
    }

    @Get(':id')
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.STAFF])
    @ApiOperation({ summary: 'Get a test result by ID' })
    findOne(@Param('id') id: string) {
        return this.testResultsService.findOne(id);
    }

    @Patch(':id')
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.STAFF])
    @ApiOperation({ summary: 'Update a test result by ID' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateTestResultDto: UpdateTestResultDto,
    ) {
        return this.testResultsService.update(id, updateTestResultDto);
    }

    @Delete(':id')
    @Roles([RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Delete a test result by ID' })
    @ResponseMessage('Test result deleted successfully.')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.testResultsService.remove(id);
    }

    @Post(':id/send-notification')
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.STAFF])
    @ApiOperation({
        summary: 'Send test result notification to patient',
        description:
            'Gửi thông báo kết quả xét nghiệm cho bệnh nhân qua email và in-app notification',
    })
    @ApiParam({ name: 'id', description: 'Test result ID' })
    @ResponseMessage('Test result notification sent successfully.')
    async sendNotificationToPatient(@Param('id', ParseUUIDPipe) id: string) {
        return this.testResultsService.sendNotificationToPatient(id);
    }

    @Post('appointment/:appointmentId/send-notification')
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.STAFF])
    @ApiOperation({
        summary: 'Send test result notification by appointment ID',
        description:
            'Gửi thông báo kết quả xét nghiệm cho bệnh nhân theo appointment ID',
    })
    @ApiParam({ name: 'appointmentId', description: 'Appointment ID' })
    @ResponseMessage('Test result notification sent successfully.')
    async sendNotificationByAppointmentId(
        @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    ) {
        return this.testResultsService.sendNotificationByAppointmentId(
            appointmentId,
        );
    }

    @Get('patient/my-results')
    @ApiOperation({
        summary: 'Get patient own test results',
        description: 'Bệnh nhân xem kết quả xét nghiệm của chính mình',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of patient test results',
        type: [TestResultResponseDto],
    })
    @ResponseMessage('Get patient test results successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.CUSTOMER])
    async getMyTestResults(@CurrentUser() user: User) {
        return this.testResultsService.findByPatientId(user.id);
    }

    @Get('patient/result/:id')
    @ApiOperation({
        summary: 'Get patient test result details',
    })
    @ApiParam({ name: 'id', description: 'Test result ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Test result details',
        type: TestResultResponseDto,
    })
    @ResponseMessage('Get test result details successfully')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.CUSTOMER])
    async getMyTestResultDetails(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: User,
    ) {
        return this.testResultsService.findOneByPatient(id, user.id);
    }

    @Get(':id/export-pdf')
    @ApiOperation({
        summary: 'Export test result as PDF',
        description: 'Xuất kết quả xét nghiệm ra file PDF để download',
    })
    @ApiParam({ name: 'id', description: 'Test result ID' })
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.STAFF, RolesNameEnum.CUSTOMER])
    async exportTestResultToPdf(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: User,
        @Res() res: Response,
    ) {
        const pdfBuffer =
            await this.testResultExportPdfService.generateTestResultPdf(
                id,
                user,
            );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="test-result-${id}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });

        res.send(pdfBuffer);
    }

    @Get('consultation/:appointmentId/export-pdf')
    @ApiOperation({
        summary: 'Export consultation report as PDF',
        description: 'Xuất báo cáo tư vấn trực tuyến ra file PDF',
    })
    @ApiParam({
        name: 'appointmentId',
        description: 'Consultation appointment ID',
    })
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.STAFF, RolesNameEnum.CUSTOMER])
    async exportConsultationToPdf(
        @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
        @CurrentUser() user: User,
        @Res() res: Response,
    ) {
        const pdfBuffer =
            await this.testResultExportPdfService.generateConsultationPdf(
                appointmentId,
                user,
            );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="consultation-${appointmentId}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });

        res.send(pdfBuffer);
    }

    @Get('sti/:stiProcessId/export-pdf')
    @ApiOperation({
        summary: 'Export STI test result as PDF',
        description:
            'Xuất kết quả xét nghiệm STI ra file PDF với format chuyên biệt',
    })
    @ApiParam({ name: 'stiProcessId', description: 'STI test process ID' })
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.STAFF, RolesNameEnum.CUSTOMER])
    async exportStiTestResultToPdf(
        @Param('stiProcessId', ParseUUIDPipe) stiProcessId: string,
        @CurrentUser() user: User,
        @Res() res: Response,
    ) {
        const pdfBuffer =
            await this.testResultExportPdfService.generateStiTestResultPdf(
                stiProcessId,
                user,
            );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="sti-result-${stiProcessId}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });

        res.send(pdfBuffer);
    }
}
