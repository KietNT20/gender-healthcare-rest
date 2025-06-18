import { ApiBearerAuth } from '@nestjs/swagger';
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
  } from '@nestjs/common';
  import { AppointmentsService } from './appointments.service';
  import { CreateAppointmentDto } from './dto/create-appointment.dto';
  import { UpdateAppointmentDto } from './dto/update-appointment.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RoleGuard } from 'src/guards/role.guard';
  import { Roles } from 'src/decorators/roles.decorator';
  import { RolesNameEnum } from 'src/enums';
  
  @ApiBearerAuth()
  @Controller('appointments')
  export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) {}
  
    @Post()
    // @UseGuards(JwtAuthGuard, RoleGuard)
    // @Roles([RolesNameEnum.CUSTOMER, RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
    async create(@Body() createAppointmentDto: CreateAppointmentDto) {
      return this.appointmentsService.create(createAppointmentDto);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
    findAll() {
      return this.appointmentsService.findAll();
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.CUSTOMER, RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
    async findOne(@Param('id') id: string) {
      return this.appointmentsService.findOne(id);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
    async update(
      @Param('id') id: string,
      @Body() updateAppointmentDto: UpdateAppointmentDto,
    ) {
      return this.appointmentsService.update(id, updateAppointmentDto);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN])
    async remove(@Param('id') id: string) {
      await this.appointmentsService.remove(id);
      return { message: 'Appointment deleted successfully' };
    }
  }