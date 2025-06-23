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

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly paymentServicesService: PaymentServicesService,
    ) {}

    @Get('available-packages')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get a list of available service packages for payment',
    })
    getAvailablePackages(@Query() query: GetPayablePackagesDto) {
        return this.paymentServicesService.getAvailablePackages(query);
    }

    @Get('available-services')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get a list of available services for payment' })
    getAvailableServices(@Query() query: GetPayablePackagesDto) {
        return this.paymentServicesService.getAvailableServices(query);
    }

    @Get('pending-appointments')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get a list of pending appointments for the current user',
    })
    getPendingAppointments(@CurrentUser() currentUser: User) {
        return this.paymentsService.getPendingAppointments(currentUser.id);
    }

    @Get('user-stats')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user payment statistics' })
    getUserPaymentStats(@CurrentUser() currentUser: User) {
        return this.paymentsService.getUserPaymentStats(currentUser.id);
    }

    @Post('packages')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
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
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
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
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
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
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    findAll() {
        return this.paymentsService.findAll();
    }

    @Get('callback/success')
    async handleSuccessCallback(
        @Query('orderCode') orderCode: string,
        @Res() res: Response,
    ) {
        const result =
            await this.paymentsService.handleSuccessCallback(orderCode);
        return res.redirect(result.redirectUrl);
    }

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

    @Post('webhook')
    @ApiOperation({
        summary: 'PayOS webhook',
        description: 'Endpoint cho PayOS webhook notifications',
    })
    async handleWebhook(@Body() webhookData: WebhookType) {
        return this.paymentsService.verifyWebhook(webhookData);
    }

    @Get('my-payments')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get current user payments',
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

    @Get(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    findOne(
        @Param('id', ParseUUIDPipe)
        id: string,
    ) {
        return this.paymentsService.findOne(id);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    remove(
        @Param('id', ParseUUIDPipe)
        id: string,
    ) {
        return this.paymentsService.remove(id);
    }

    @Patch(':id/cancel')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Cancel a pending payment',
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

    @Get(':id/details')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get payment details for current user',
    })
    @ResponseMessage('Lấy chi tiết thanh toán thành công')
    getMyPaymentDetails(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.paymentsService.findPaymentByIdAndUser(id, currentUser.id);
    }
}
