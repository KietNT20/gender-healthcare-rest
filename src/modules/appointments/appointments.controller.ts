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
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AppointmentAttendanceService } from './appointment-attendance.service';
import { AppointmentMeetingLinkService } from './appointment-meeting-link.service';
import { AppointmentsService } from './appointments.service';
import {
    CheckInAppointmentDto,
    CheckInResponseDto,
} from './dto/check-in-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
    FindAvailableSlotsDto,
    FindAvailableSlotsResponseDto,
} from './dto/find-available-slots.dto';
import {
    LateCheckInDto,
    LateCheckInResponseDto,
} from './dto/late-check-in.dto';
import { MarkNoShowDto, NoShowProcessResult } from './dto/mark-no-show.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import {
    CancelAppointmentDto,
    UpdateAppointmentDto,
} from './dto/update-appointment.dto';
import {
    ConsultantAppointmentsMeetingQueryDto,
    UpdateMeetingLinkDto,
} from './dto/update-meeting-link.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
    constructor(
        private readonly appointmentsService: AppointmentsService,
        private readonly attendanceService: AppointmentAttendanceService,
        private readonly meetingLinkService: AppointmentMeetingLinkService,
    ) {}

    @Post()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.CUSTOMER])
    @ApiOperation({
        summary: 'Book an appointment with selected consultant',
        description:
            'Đặt cuộc hẹn với tư vấn viên đã được chọn từ danh sách available slots',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Appointment created successfully.',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Consultant not available or specialty mismatch.',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Forbidden: You do not have permission ( Customer only ).',
    })
    create(
        @Body() createAppointmentDto: CreateAppointmentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.create(
            createAppointmentDto,
            currentUser,
        );
    }

    @Get()
    @ApiOperation({
        summary: 'Get a list of appointments (role-based access)',
    })
    @ResponseMessage('Successfully retrieved appointment list.')
    findAll(
        @Query() queryDto: QueryAppointmentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.findAll(currentUser, queryDto);
    }

    @Post('available-slots')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.CUSTOMER])
    @ApiOperation({
        summary: 'Find available consultation slots',
        description:
            'Tìm kiếm các slot tư vấn khả dụng dựa trên dịch vụ và khoảng thời gian',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Available slots retrieved successfully.',
        type: FindAvailableSlotsResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Forbidden: You do not have permission ( Customer only ).',
    })
    @ApiBody({ type: FindAvailableSlotsDto })
    @ResponseMessage('Available slots retrieved successfully.')
    findAvailableSlots(@Body() findSlotsDto: FindAvailableSlotsDto) {
        return this.appointmentsService.findAvailableSlots(findSlotsDto);
    }

    @Get('/me/:id')
    @ApiOperation({ summary: 'Get appointment details' })
    @ResponseMessage('Successfully retrieved appointment details.')
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.findOne(id, currentUser);
    }

    @Get('consultant/my-appointments')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.CONSULTANT])
    @ApiOperation({
        summary: 'Get consultant appointments',
    })
    @ApiOkResponse({
        description: 'Consultant appointments retrieved successfully.',
    })
    @ApiForbiddenResponse({
        description: 'Forbidden: You do not have permission (Consultant only).',
    })
    @ResponseMessage('Successfully retrieved consultant appointments.')
    getConsultantAppointments(
        @Query() queryDto: ConsultantAppointmentsMeetingQueryDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.meetingLinkService.getConsultantAppointments(
            currentUser,
            queryDto,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get appointment details' })
    @ResponseMessage('Successfully retrieved appointment details.')
    findOneById(@Param('id', ParseUUIDPipe) id: string) {
        return this.appointmentsService.findOneById(id);
    }

    @Get(':id/chat-room')
    @ApiOperation({ summary: 'Get chat room for an appointment' })
    @ResponseMessage('Successfully retrieved chat room.')
    async getChatRoom(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        const appointment = await this.appointmentsService.findOne(
            id,
            currentUser,
        );
        const chatRoom =
            await this.appointmentsService.getChatRoomByAppointmentId(id);

        return {
            appointment,
            chatRoom,
        };
    }

    @Patch(':id/status')
    @UseGuards(RoleGuard)
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CONSULTANT,
    ])
    @ApiOperation({
        summary: 'Update appointment status (e.g., confirm, complete)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Appointment status updated successfully.',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission ( Admin, Manager, Consultant only ).',
    })
    @ResponseMessage('Successfully updated appointment status.')
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateAppointmentDto: UpdateAppointmentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.updateStatus(
            id,
            updateAppointmentDto,
            currentUser,
        );
    }

    @Patch(':id/cancel')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.CUSTOMER, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Cancel an appointment' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Appointment canceled successfully.',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission ( Customer, Admin, Manager only ).',
    })
    @ResponseMessage('Successfully canceled appointment.')
    cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() cancelDto: CancelAppointmentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.cancel(id, cancelDto, currentUser);
    }

    @Post(':id/check-in')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Check-in patient for appointment',
        description:
            'Check-in bệnh nhân tại cơ sở y tế (Staff/Admin/Manager only)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Patient checked in successfully.',
        type: CheckInResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description:
            'Appointment cannot be checked in (invalid status, already checked in, etc.)',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Staff/Admin/Manager only)',
    })
    @ResponseMessage('Patient checked in successfully.')
    async checkInPatient(
        @Param('id', ParseUUIDPipe) appointmentId: string,
        @Body() checkInDto: CheckInAppointmentDto,
    ): Promise<CheckInResponseDto> {
        return this.attendanceService.checkInPatient(appointmentId, checkInDto);
    }

    @Post(':id/mark-no-show')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Mark appointment as no-show',
        description:
            'Đánh dấu appointment là no-show (Staff/Admin/Manager only)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Appointment marked as no-show successfully.',
        type: NoShowProcessResult,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Appointment cannot be marked as no-show (invalid status)',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Staff/Admin/Manager only)',
    })
    @ResponseMessage('Appointment marked as no-show successfully.')
    async markNoShow(
        @Param('id', ParseUUIDPipe) appointmentId: string,
        @Body() noShowDto: MarkNoShowDto,
    ): Promise<NoShowProcessResult> {
        return this.attendanceService.markNoShow(appointmentId, noShowDto);
    }

    @Post(':id/late-check-in')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Process late check-in for appointment',
        description:
            'Xử lý check-in trễ cho appointment (Staff/Admin/Manager only)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Late check-in processed successfully.',
        type: LateCheckInResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description:
            'Late check-in cannot be processed (too late, invalid status, etc.)',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden: You do not have permission (Staff/Admin/Manager only)',
    })
    @ResponseMessage('Late check-in processed successfully.')
    async processLateCheckIn(
        @Param('id', ParseUUIDPipe) appointmentId: string,
        @Body() lateCheckInDto: LateCheckInDto,
    ): Promise<LateCheckInResponseDto> {
        return this.attendanceService.processLateCheckIn(
            appointmentId,
            lateCheckInDto,
        );
    }

    @Patch(':id/meeting-link')
    @UseGuards(RoleGuard)
    @Roles([
        RolesNameEnum.CONSULTANT,
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
    ])
    @ApiOperation({
        summary: 'Update meeting link for appointment',
    })
    @ApiOkResponse({
        description: 'Meeting link updated successfully.',
    })
    @ApiBadRequestResponse({
        description: 'Invalid meeting link or insufficient permissions.',
    })
    @ApiForbiddenResponse({
        description:
            'Forbidden: You do not have permission (Consultant/Admin/Manager only).',
    })
    @ResponseMessage('Meeting link updated successfully.')
    updateMeetingLink(
        @Param('id', ParseUUIDPipe) appointmentId: string,
        @Body() updateDto: UpdateMeetingLinkDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.meetingLinkService.updateMeetingLink(
            appointmentId,
            updateDto,
            currentUser,
        );
    }

    @Get(':id/meeting-link')
    @ApiOperation({
        summary: 'Get meeting link for appointment',
        description:
            'Lấy meeting link của cuộc hẹn (chỉ những người liên quan)',
    })
    @ApiOkResponse({
        description: 'Meeting link retrieved successfully.',
    })
    @ApiBadRequestResponse({
        description: 'Insufficient permissions to view meeting link.',
    })
    getMeetingLink(
        @Param('id', ParseUUIDPipe) appointmentId: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.meetingLinkService.getMeetingLink(
            appointmentId,
            currentUser,
        );
    }

    @Delete(':id/meeting-link')
    @UseGuards(RoleGuard)
    @Roles([
        RolesNameEnum.CONSULTANT,
        RolesNameEnum.ADMIN,
        RolesNameEnum.MANAGER,
    ])
    @ApiOperation({
        summary: 'Remove meeting link from appointment',
        description:
            'Xóa meeting link của cuộc hẹn (Consultant/Admin/Manager only)',
    })
    @ApiOkResponse({
        description: 'Meeting link removed successfully.',
    })
    @ApiBadRequestResponse({
        description: 'Insufficient permissions to remove meeting link.',
    })
    @ApiForbiddenResponse({
        description:
            'Forbidden: You do not have permission (Consultant/Admin/Manager only).',
    })
    removeMeetingLink(
        @Param('id', ParseUUIDPipe) appointmentId: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.meetingLinkService.removeMeetingLink(
            appointmentId,
            currentUser,
        );
    }
}
