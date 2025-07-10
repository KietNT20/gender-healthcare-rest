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
     * Tạo lịch hẹn xét nghiệm STI
     */
    @Post()
    @ApiOperation({
        summary: 'Đặt lịch xét nghiệm STI',
        description: 'Tạo lịch hẹn mới cho việc xét nghiệm STI',
    })
    @ApiBody({ type: CreateStiAppointmentDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Lịch hẹn STI đã được tạo thành công',
        type: Appointment,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Có xung đột với lịch hẹn khác',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy dịch vụ hoặc tư vấn viên',
    })
    @ResponseMessage('Đặt lịch xét nghiệm STI thành công')
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
     * Lấy danh sách lịch hẹn STI của người dùng
     */
    @Get()
    @ApiOperation({
        summary: 'Lấy danh sách lịch hẹn STI',
        description:
            'Lấy tất cả lịch hẹn xét nghiệm STI của người dùng hiện tại',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách lịch hẹn STI',
        type: [Appointment],
    })
    @ResponseMessage('Lấy danh sách lịch hẹn STI thành công')
    async getUserStiAppointments(
        @CurrentUser() currentUser: User,
    ): Promise<Appointment[]> {
        return await this.stiAppointmentsService.getUserStiAppointments(
            currentUser.id,
        );
    }

    /**
     * Hủy lịch hẹn STI
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'Hủy lịch hẹn STI',
        description: 'Hủy lịch hẹn xét nghiệm STI đã đặt',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của lịch hẹn STI cần hủy',
        type: String,
        format: 'uuid',
    })
    @ApiBody({
        type: CancelStiAppointmentDto,
        description: 'Thông tin hủy lịch hẹn',
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Hủy lịch hẹn STI thành công',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy lịch hẹn',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Không thể hủy lịch hẹn này',
    })
    @ResponseMessage('Hủy lịch hẹn STI thành công')
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
     * Lấy thông tin chi tiết lịch hẹn STI
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Lấy thông tin chi tiết lịch hẹn STI',
        description: 'Lấy thông tin chi tiết của một lịch hẹn STI cụ thể',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của lịch hẹn STI',
        type: String,
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Thông tin chi tiết lịch hẹn STI',
        type: Appointment,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy lịch hẹn',
    })
    @ResponseMessage('Lấy thông tin lịch hẹn STI thành công')
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
