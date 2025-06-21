import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
        @CurrentUser() currentUser: User,
        @Query() queryDto: QueryAppointmentDto,
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
    @ResponseMessage('Successfully canceled appointment.')
    cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() cancelDto: CancelAppointmentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.appointmentsService.cancel(id, cancelDto, currentUser);
    }
}
