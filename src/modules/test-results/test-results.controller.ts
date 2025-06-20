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
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { UpdateTestResultDto } from './dto/update-test-result.dto';
import { TestResultsService } from './test-results.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('test-results')
export class TestResultsController {
    constructor(private readonly testResultsService: TestResultsService) {}

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
    @Roles([RolesNameEnum.CUSTOMER, RolesNameEnum.ADMIN, RolesNameEnum.STAFF])
    @ApiOperation({ summary: 'Get test result for a specific appointment' })
    @ResponseMessage('Test result retrieved successfully.')
    findOneByAppointment(
        @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
        @CurrentUser() user: User,
    ) {
        return this.testResultsService.findByAppointmentId(appointmentId, user);
    }

    @Get()
    findAll() {
        return this.testResultsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.testResultsService.findOne(id);
    }

    @Patch(':id')
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.STAFF])
    update(
        @Param('id') id: string,
        @Body() updateTestResultDto: UpdateTestResultDto,
    ) {
        return this.testResultsService.update(id, updateTestResultDto);
    }

    @Delete(':id')
    @Roles([RolesNameEnum.ADMIN])
    remove(@Param('id') id: string) {
        return this.testResultsService.remove(id);
    }
}
