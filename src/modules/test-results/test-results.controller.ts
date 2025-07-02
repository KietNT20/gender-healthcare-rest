import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { TestResultDataDto } from './dto/test-result-data.dto';
import {
    RecommendationsResponseDto,
    TestResultTemplateResponseDto,
    ValidationResponseDto,
} from './dto/test-result-response.dto';
import { UpdateTestResultDto } from './dto/update-test-result.dto';
import { ServiceType } from './enums/test-result.enums';
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
    @ApiOperation({ summary: 'Create a new test result with file upload' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                appointmentId: { type: 'string', format: 'uuid' },
                resultData: { type: 'object' },
                resultSummary: { type: 'string' },
                isAbnormal: { type: 'boolean' },
                recommendation: { type: 'string' },
                followUpRequired: { type: 'boolean' },
                followUpNotes: { type: 'string' },
            },
        },
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
}
