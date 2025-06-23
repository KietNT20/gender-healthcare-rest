import {
    BadRequestException,
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
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { WebhookType } from '@payos/node/lib/type';
import { Response } from 'express';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Public } from 'src/decorators/public.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { PaymentStatusType } from 'src/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { CreateAppointmentPaymentDto } from './dto/create-appointment-payment.dto';
import { CreatePackagePaymentDto } from './dto/create-package-payment.dto';
import { CreateServicePaymentDto } from './dto/create-service-payment.dto';
import { GetPayablePackagesDto } from './dto/get-payable-packages.dto';
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

    @Post('packages')
    @ApiOperation({ summary: 'Create payment for service package' })
    createPackagePayment(
        @Body() createDto: CreatePackagePaymentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.paymentsService.createPackagePayment(
            createDto,
            currentUser.id,
        );
    }

    @Post('appointments')
    @ApiOperation({ summary: 'Create payment for appointment' })
    createAppointmentPayment(
        @Body() createDto: CreateAppointmentPaymentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.paymentsService.createAppointmentPayment(
            createDto,
            currentUser.id,
        );
    }

    @Post('services')
    @ApiOperation({ summary: 'Create payment for service' })
    createServicePayment(
        @Body() createDto: CreateServicePaymentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.paymentsService.createServicePayment(
            createDto,
            currentUser.id,
        );
    }

    @Get()
    findAll() {
        return this.paymentsService.findAll();
    }

    @Public()
    @Get('callback/success')
    async handleSuccessCallback(
        @Query('orderCode') orderCode: string,
        @Res() res: Response,
    ) {
        const result =
            await this.paymentsService.handleSuccessCallback(orderCode);
        return res.redirect(result.redirectUrl);
    }

    @Public()
    @Get('callback/cancel')
    async handleCancelCallback(
        @Query('orderCode') orderCode: string,
        @Res() res: Response,
    ) {
        const result =
            await this.paymentsService.handleCancelCallback(orderCode);
        return res.redirect(result.redirectUrl);
    }

    @Get('cancel/*path')
    async handleInvalidCancel() {
        throw new BadRequestException(
            'Yêu cầu hủy không hợp lệ. Vui lòng sử dụng đúng URL /payments/cancel với các tham số query hợp lệ.',
        );
    }

    @Public()
    @Post('webhook')
    @ApiOperation({
        summary: 'PayOS webhook',
        description: 'Endpoint cho PayOS webhook notifications',
    })
    async handleWebhook(@Body() webhookData: WebhookType) {
        return this.paymentsService.verifyWebhook(webhookData);
    }

    @Get(':id')
    findOne(
        @Param('id', ParseUUIDPipe)
        id: string,
    ) {
        return this.paymentsService.findOne(id);
    }

    @Delete(':id')
    remove(
        @Param('id', ParseUUIDPipe)
        id: string,
    ) {
        return this.paymentsService.remove(id);
    }

    @Patch(':id/cancel')
    @ApiOperation({
        summary: 'Cancel a pending payment',
        description:
            'Hủy thanh toán đang chờ xử lý. Chỉ có thể hủy payment với status PENDING.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Payment cancelled successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: {
                    type: 'string',
                    example: 'Hủy thanh toán thành công',
                },
                payment: { type: 'object' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Cannot cancel payment (not pending or already processed)',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Payment not found or access denied',
    })
    @ResponseMessage('Hủy thanh toán thành công')
    cancelPayment(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
        @Body() cancelDto?: CancelPaymentDto,
    ) {
        return this.paymentsService.cancelPaymentByUser(
            id,
            currentUser.id,
            cancelDto,
        );
    }

    @Get('my-payments')
    @ApiOperation({
        summary: 'Get current user payments',
        description: 'Lấy danh sách thanh toán của user hiện tại',
    })
    @ApiQuery({
        name: 'status',
        enum: PaymentStatusType,
        required: false,
        description: 'Filter by payment status',
    })
    @ResponseMessage('Lấy danh sách thanh toán thành công')
    getMyPayments(
        @CurrentUser() currentUser: User,
        @Query('status') status?: PaymentStatusType,
    ) {
        return this.paymentsService.getUserPayments(currentUser.id, status);
    }

    @Get(':id/details')
    @ApiOperation({
        summary: 'Get payment details for current user',
        description: 'Lấy chi tiết thanh toán (chỉ payment của user hiện tại)',
    })
    @ResponseMessage('Lấy chi tiết thanh toán thành công')
    getMyPaymentDetails(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.paymentsService.findPaymentByIdAndUser(id, currentUser.id);
    }
}
