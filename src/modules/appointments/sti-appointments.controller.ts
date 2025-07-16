import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CancelStiAppointmentDto } from './dto/cancel-sti-appointment.dto';
import { CreateStiAppointmentDto } from './dto/create-sti-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { StiAppointmentsService } from './sti-appointments.service';

@ApiTags('STI Appointments')
@Controller('sti-appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class StiAppointmentsController {
    constructor(
        private readonly stiAppointmentsService: StiAppointmentsService,
    ) {}

    /**
     * Create an STI testing appointment
     */
    @Post()
    @ApiOperation({
        summary: 'Book an STI testing appointment',
        description: 'Create a new appointment for STI testing',
    })
    @ApiBody({ type: CreateStiAppointmentDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'STI appointment has been successfully created',
        type: Appointment,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'There is a conflict with another appointment',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Service or counselor not found',
    })
    @ResponseMessage('Successfully booked STI testing appointment')
    async createStiAppointment(
        @Body() createStiAppointmentDto: CreateStiAppointmentDto,
        @CurrentUser() currentUser: User,
    ): Promise<Appointment> {
        return await this.stiAppointmentsService.createStiAppointment(
            createStiAppointmentDto,
            currentUser,
        );
    }

    /**
     * Get the user's list of STI appointments
     */
    @Get()
    @ApiOperation({
        summary: 'Get STI appointments list',
        description: 'Get all STI testing appointments for the current user',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of STI appointments',
        type: [Appointment],
    })
    @ResponseMessage('Successfully retrieved STI appointments list')
    async getUserStiAppointments(
        @CurrentUser() currentUser: User,
    ): Promise<Appointment[]> {
        return await this.stiAppointmentsService.getUserStiAppointments(
            currentUser.id,
        );
    }

    /**
     * Cancel an STI appointment
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'Cancel STI appointment',
        description: 'Cancel a booked STI testing appointment',
    })
    @ApiParam({
        name: 'id',
        description: 'ID of the STI appointment to cancel',
        type: String,
        format: 'uuid',
    })
    @ApiBody({
        type: CancelStiAppointmentDto,
        description: 'Appointment cancellation information',
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'STI appointment cancelled successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Appointment not found',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'This appointment cannot be cancelled',
    })
    @ResponseMessage('Successfully cancelled STI appointment')
    async cancelStiAppointment(
        @Param('id', ParseUUIDPipe) appointmentId: string,
        @CurrentUser() currentUser: User,
        @Body() cancelDto?: CancelStiAppointmentDto,
    ): Promise<void> {
        await this.stiAppointmentsService.cancelStiAppointment(
            appointmentId,
            currentUser.id,
            cancelDto?.reason,
        );
    }

    /**
     * Get STI appointment details
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Get STI appointment details',
        description: 'Get the details of a specific STI appointment',
    })
    @ApiParam({
        name: 'id',
        description: 'ID of the STI appointment',
        type: String,
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'STI appointment details',
        type: Appointment,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Appointment not found',
    })
    @ResponseMessage('Successfully retrieved STI appointment details')
    async getStiAppointmentById(
        @Param('id', ParseUUIDPipe) appointmentId: string,
        @CurrentUser() currentUser: User,
    ): Promise<Appointment> {
        return await this.stiAppointmentsService.getStiAppointmentById(
            appointmentId,
            currentUser.id,
        );
    }
}
