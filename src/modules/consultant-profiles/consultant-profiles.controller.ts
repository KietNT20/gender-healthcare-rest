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
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { ConsultantProfilesService } from './consultant-profiles.service';
import { ConsultantRegistrationService } from './consultant-registration/consultant-registration.service';
import { CreateConsultantProfileDto } from './dto/create-consultant-profile.dto';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { QueryConsultantProfileDto } from './dto/query-consultant-profile.dto';
import {
    RegisterConsultantDataDto,
    RegisterConsultantDto,
} from './dto/register-consultant.dto';
import { RejectProfileDto } from './dto/review-profile.dto';
import { UpdateConsultantProfileDto } from './dto/update-consultant-profile.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';

@ApiTags('Consultant Profiles')
@Controller('consultant-profiles')
export class ConsultantProfilesController {
    constructor(
        private readonly consultantProfilesService: ConsultantProfilesService,
        private readonly registrationService: ConsultantRegistrationService,
    ) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new consultant account' })
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cv', maxCount: 1 },
            { name: 'certificates', maxCount: 5 },
        ]),
    )
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: RegisterConsultantDto })
    async register(
        @Body() registerDto: RegisterConsultantDataDto,
        @UploadedFiles()
        files: {
            cv?: Express.Multer.File;
            certificates?: Express.Multer.File[];
        },
    ) {
        return this.registrationService.register(registerDto, files);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a consultant profile' })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin, or Manager only).',
    })
    @ResponseMessage('Consultant profile created successfully.')
    create(@Body() createDto: CreateConsultantProfileDto) {
        return this.consultantProfilesService.create(createDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all consultant profiles with filters and pagination',
    })
    @ResponseMessage('Consultant profiles retrieved successfully.')
    findAll(@Query() queryDto: QueryConsultantProfileDto) {
        return this.consultantProfilesService.findAll(queryDto);
    }

    @Put('me')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.CONSULTANT])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update my consultant profile' })
    @ResponseMessage('Consultant profile updated successfully.')
    updateMyProfile(
        @CurrentUser() user: User,
        @Body() updateDto: UpdateConsultantProfileDto,
    ) {
        return this.consultantProfilesService.updateMyProfile(
            user.id,
            updateDto,
        );
    }

    @Get('me')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.CONSULTANT])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my consultant profile' })
    @ResponseMessage('My consultant profile retrieved successfully.')
    findMyProfile(@CurrentUser() user: User) {
        return this.consultantProfilesService.getMyProfile(user.id);
    }

    @Get('pending-approval')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get all pending consultant profiles for approval',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin, or Manager only).',
    })
    @ResponseMessage('Pending profiles retrieved successfully.')
    findPending() {
        return this.consultantProfilesService.findPendingProfiles();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single consultant profile by ID' })
    @ResponseMessage('Consultant profile retrieved successfully.')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.consultantProfilesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a consultant profile' })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin, or Manager only).',
    })
    @ResponseMessage('Consultant profile updated successfully.')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateConsultantProfileDto,
    ) {
        return this.consultantProfilesService.update(id, updateDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a consultant profile' })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Forbidden: You do not have permission (Admin only).',
    })
    @ResponseMessage('Consultant profile deleted successfully.')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.consultantProfilesService.remove(id);
    }

    @Patch(':id/approve')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Approve a consultant profile' })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin, or Manager only).',
    })
    @ResponseMessage('Profile approved successfully.')
    approve(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() admin: User,
    ) {
        return this.consultantProfilesService.approveProfile(id, admin.id);
    }

    @Patch(':id/reject')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reject a consultant profile' })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Admin, or Manager only).',
    })
    @ResponseMessage('Profile rejected successfully.')
    reject(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() rejectDto: RejectProfileDto,
        @CurrentUser() admin: User,
    ) {
        return this.consultantProfilesService.rejectProfile(
            id,
            rejectDto,
            admin.id,
        );
    }

    @Patch(':id/working-hours')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.CONSULTANT,
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
    ])
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Update working hours and auto-generate availability schedule',
        description:
            'Update working hours for a consultant and automatically generate their availability schedule for the next 4 weeks.',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Consultant, Admin, or Manager only).',
    })
    @ResponseMessage(
        'Working hours updated and schedule generated successfully.',
    )
    updateWorkingHours(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateWorkingHoursDto,
    ) {
        return this.consultantProfilesService.updateWorkingHoursAndGenerateSchedule(
            id,
            updateDto.workingHours,
            updateDto.weeksToGenerate,
        );
    }

    @Post(':id/generate-schedule')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.CONSULTANT,
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
    ])
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Generate availability schedule from working hours',
        description:
            'Generate availability schedule from the pre-defined working hours',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Consultant, Admin, or Manager only).',
    })
    @ResponseMessage('Schedule generated successfully.')
    generateSchedule(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() generateDto: GenerateScheduleDto,
    ) {
        return this.consultantProfilesService.generateScheduleFromWorkingHours(
            id,
            generateDto.weeksToGenerate,
        );
    }

    @Post(':id/ensure-upcoming-schedule')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([
        RolesNameEnum.CONSULTANT,
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
    ])
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Ensure upcoming weeks have availability schedule',
        description:
            'Ensure there is always an availability schedule for the upcoming weeks',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Consultant, Admin, or Manager only).',
    })
    @ResponseMessage('Upcoming schedule ensured successfully.')
    ensureUpcomingSchedule(@Param('id', ParseUUIDPipe) id: string) {
        return this.consultantProfilesService.ensureUpcomingSchedule(id);
    }
}
