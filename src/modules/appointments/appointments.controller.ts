import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import {
    CancelAppointmentDto,
    UpdateAppointmentDto,
} from './dto/update-appointment.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) {}

    @Post()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.CUSTOMER])
    @ApiOperation({ summary: 'Book an appointment' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Appointment created successfully.',
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

    @Get(':id')
    @ApiOperation({ summary: 'Get appointment details' })
    @ResponseMessage('Successfully retrieved appointment details.')
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.findOne(id, currentUser);
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
}
