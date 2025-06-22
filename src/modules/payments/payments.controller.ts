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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { GetPayablePackagesDto } from './dto/get-payable-packages.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Get('available-packages')
    @ApiOperation({
        summary: 'Get a list of available service packages for payment',
    })
    getAvailablePackages(@Query() query: GetPayablePackagesDto) {
        return this.paymentsService.getAvailablePackages(query);
    }

    @Get('available-services')
    @ApiOperation({ summary: 'Get a list of available services for payment' })
    getAvailableServices(
        @Query() query: { search?: string; isActive?: boolean },
    ) {
        return this.paymentsService.getAvailableServices(query);
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
        console.log('Thống kê thanh toán của user:', currentUser.id);
        return this.paymentsService.getUserPaymentStats(currentUser.id);
    }

    @Post()
    create(
        @Body() createPaymentDto: CreatePaymentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.paymentsService.create(createPaymentDto);
    }

    @Post('packages/:packageId')
    @ApiOperation({ summary: 'Create payment for service package' })
    @ApiParam({ name: 'packageId', description: 'Service Package ID' })
    createPackagePayment(
        @Param('packageId', ParseUUIDPipe) packageId: string,
        @CurrentUser() currentUser: User,
        @Body() data?: { description?: string },
    ) {
        return this.paymentsService.create({
            userId: currentUser.id,
            packageId,
            description: data?.description || `Thanh toán gói dịch vụ`,
            atLeastOneId: true,
        });
    }

    @Post('appointments/:appointmentId')
    @ApiOperation({ summary: 'Create payment for appointment' })
    @ApiParam({ name: 'appointmentId', description: 'Appointment ID' })
    createAppointmentPayment(
        @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
        @CurrentUser() currentUser: User,
        @Body() data?: { description?: string },
    ) {
        return this.paymentsService.create({
            userId: currentUser.id,
            appointmentId,
            description: data?.description || `Thanh toán cuộc hẹn`,
            atLeastOneId: true,
        });
    }

    @Post('services/:serviceId')
    @ApiOperation({ summary: 'Create payment for service' })
    @ApiParam({ name: 'serviceId', description: 'Service ID' })
    createServicePayment(
        @Param('serviceId', ParseUUIDPipe) serviceId: string,
        @CurrentUser() currentUser: User,
        @Body() data?: { description?: string },
    ) {
        return this.paymentsService.create({
            userId: currentUser.id,
            serviceId,
            description: data?.description || `Thanh toán dịch vụ`,
            atLeastOneId: true,
        });
    }

    @Get()
    findAll() {
        console.log('Lấy tất cả thanh toán');
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
    async handleSuccess(@Query() query: any, @CurrentUser() currentUser: User) {
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

    @Post('webhook')
    async handleWebhook(@Body() webhookData: any) {
        console.log('Nhận webhook:', webhookData);
        const payment = await this.paymentsService.verifyWebhook(webhookData);
        return { message: 'Webhook đã được xử lý', payment };
    }

    @Get(':id')
    findOne(
        @Param(
            'id',
            new ParseUUIDPipe({
                errorHttpStatusCode: 400,
                exceptionFactory: () =>
                    new BadRequestException('ID phải là UUID hợp lệ'),
            }),
        )
        id: string,
    ) {
        console.log(`Yêu cầu tìm thanh toán với id: ${id}`);
        return this.paymentsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param(
            'id',
            new ParseUUIDPipe({
                errorHttpStatusCode: 400,
                exceptionFactory: () =>
                    new BadRequestException('ID phải là UUID hợp lệ'),
            }),
        )
        id: string,
        @Body() updatePaymentDto: UpdatePaymentDto,
    ) {
        console.log(`Cập nhật thanh toán với id: ${id}`);
        return this.paymentsService.update(id, updatePaymentDto);
    }

    @Delete(':id')
    remove(
        @Param(
            'id',
            new ParseUUIDPipe({
                errorHttpStatusCode: 400,
                exceptionFactory: () =>
                    new BadRequestException('ID phải là UUID hợp lệ'),
            }),
        )
        id: string,
    ) {
        console.log(`Xóa thanh toán với id: ${id}`);
        return this.paymentsService.remove(id);
    }
}
