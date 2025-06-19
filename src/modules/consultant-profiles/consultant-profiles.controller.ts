import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
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
import { QueryConsultantProfileDto } from './dto/query-consultant-profile.dto';
import {
    RegisterConsultantDataDto,
    RegisterConsultantDto,
} from './dto/register-consultant.dto';
import { RejectProfileDto } from './dto/review-profile.dto';
import { UpdateConsultantProfileDto } from './dto/update-consultant-profile.dto';

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
        @UploadedFiles()
        files: {
            cv?: Express.Multer.File[];
            certificates?: Express.Multer.File[];
        },
    ) {
        return this.registrationService.register(registerDto, files);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a consultant profile (Admin/Manager)' })
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
    @ApiOperation({ summary: 'Update a consultant profile (Admin/Manager)' })
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
    @ApiOperation({ summary: 'Delete a consultant profile (Admin only)' })
    @ResponseMessage('Consultant profile deleted successfully.')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.consultantProfilesService.remove(id);
    }

    // --- Các endpoint review đã có từ trước ---
    @Get('pending-approval')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get all pending consultant profiles (Admin/Manager)',
    })
    @ResponseMessage('Pending profiles retrieved successfully.')
    findPending() {
        return this.consultantProfilesService.findPendingProfiles();
    }

    @Patch(':id/approve')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Approve a consultant profile (Admin/Manager)' })
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
    @ApiOperation({ summary: 'Reject a consultant profile (Admin/Manager)' })
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
}
