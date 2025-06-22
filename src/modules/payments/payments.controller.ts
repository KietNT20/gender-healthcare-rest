import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { GetPayablePackagesDto } from './dto/get-payable-packages.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentServicesService } from './payment-services.service';
import { PaymentsService } from './payments.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly paymentServicesService: PaymentServicesService,
    ) {}

    @Get('available-packages')
    @ApiOperation({
        summary: 'Get a list of available service packages for payment',
    })
    getAvailablePackages(@Query() query: GetPayablePackagesDto) {
        return this.paymentServicesService.getAvailablePackages(query);
    }

    @Get('available-services')
    @ApiOperation({ summary: 'Get a list of available services for payment' })
    getAvailableServices(@Query() query: GetPayablePackagesDto) {
        return this.paymentServicesService.getAvailableServices(query);
    }

    @Get('pending-appointments')
    @ApiOperation({
        summary: 'Get a list of pending appointments for the current user',
    })
    getPendingAppointments(@CurrentUser() currentUser: User) {
        return this.paymentsService.getPendingAppointments(currentUser.id);
    }

    @Get('user-stats')
    @ApiOperation({ summary: 'Get user payment statistics' })
    getUserPaymentStats(@CurrentUser() currentUser: User) {
        return this.paymentsService.getUserPaymentStats(currentUser.id);
    }

    @Post()
    create(
        @Body() createPaymentDto: CreatePaymentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.paymentsService.create(createPaymentDto, currentUser.id);
    }

    @Post('packages/:packageId')
    @ApiOperation({ summary: 'Create payment for service package' })
    @ApiParam({ name: 'packageId', description: 'Service Package ID' })
    createPackagePayment(
        @Param('packageId', ParseUUIDPipe) packageId: string,
        @CurrentUser() currentUser: User,
        @Body() data?: { description?: string },
    ) {
        return this.paymentsService.create(
            {
                packageId,
                description: data?.description || `Thanh toán gói dịch vụ`,
                atLeastOneId: true,
            },
            currentUser.id,
        );
    }

    @Post('appointments/:appointmentId')
    @ApiOperation({ summary: 'Create payment for appointment' })
    @ApiParam({ name: 'appointmentId', description: 'Appointment ID' })
    createAppointmentPayment(
        @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
        @CurrentUser() currentUser: User,
        @Body() data?: { description?: string },
    ) {
        return this.paymentsService.create(
            {
                appointmentId,
                description: data?.description || `Thanh toán cuộc hẹn`,
                atLeastOneId: true,
            },
            currentUser.id,
        );
    }

    @Post('services/:serviceId')
    @ApiOperation({ summary: 'Create payment for service' })
    @ApiParam({ name: 'serviceId', description: 'Service ID' })
    createServicePayment(
        @Param('serviceId', ParseUUIDPipe) serviceId: string,
        @CurrentUser() currentUser: User,
        @Body() data?: { description?: string },
    ) {
        return this.paymentsService.create(
            {
                serviceId,
                description: data?.description || `Thanh toán dịch vụ`,
                atLeastOneId: true,
            },
            currentUser.id,
        );
    }

    @Get()
    findAll() {
        return this.paymentsService.findAll();
    }

    @Get('cancel')
    async handleCancel(@Query() query: any) {
        console.log('Nhận callback hủy:', query);
        const { orderCode, status, cancel } = query;

        if (!orderCode || status !== 'CANCELLED' || cancel !== 'true') {
            throw new BadRequestException('Tham số callback hủy không hợp lệ');
        }

        try {
            const payment =
                await this.paymentsService.handleCancelCallback(orderCode);
            return { message: 'Hủy thanh toán thành công', payment };
        } catch (error) {
            console.error('Lỗi callback hủy:', error.message, error.stack);
            throw new BadRequestException(
                `Không thể xử lý callback hủy: ${error.message}`,
            );
        }
    }

    @Get('cancel/*path')
    async handleInvalidCancel() {
        throw new BadRequestException(
            'Yêu cầu hủy không hợp lệ. Vui lòng sử dụng đúng URL /payments/cancel với các tham số query hợp lệ.',
        );
    }

    @Get('success')
    async handleSuccess(@Query() query: any) {
        console.log('Nhận callback thành công:', query);
        const { orderCode } = query;
        if (!orderCode) {
            throw new BadRequestException('Tham số orderCode là bắt buộc');
        }

        try {
            const payment =
                await this.paymentsService.handleSuccessCallback(orderCode);
            return {
                success: true,
                data: {
                    message: 'Thanh toán thành công',
                    payment,
                },
            };
        } catch (error) {
            console.error(
                'Lỗi callback thành công:',
                error.message,
                error.stack,
            );
            throw new BadRequestException(
                `Không thể xử lý callback thành công: ${error.message}`,
            );
        }
    }

    @Get(':id')
    findOne(
        @Param('id', ParseUUIDPipe)
        id: string,
    ) {
        return this.paymentsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe)
        id: string,
        @Body() updatePaymentDto: UpdatePaymentDto,
    ) {
        return this.paymentsService.update(id, updatePaymentDto);
    }

    @Delete(':id')
    remove(
        @Param('id', ParseUUIDPipe)
        id: string,
    ) {
        return this.paymentsService.remove(id);
    }
}
