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
import { Response } from 'express';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { PaymentStatusType, RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { CreateAppointmentPaymentDto } from './dto/create-appointment-payment.dto';
import { CreatePackagePaymentDto } from './dto/create-package-payment.dto';
import { CreateServicePaymentDto } from './dto/create-service-payment.dto';
import { GetPayablePackagesDto } from './dto/get-payable-packages.dto';
import { WebhookTypeDTO } from './dto/webhook-type.dto';
import { PaymentServicesService } from './payment-services.service';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly paymentServicesService: PaymentServicesService,
    ) {}

    @Post('webhook')
    @ApiOperation({
        summary: 'PayOS webhook endpoint',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Webhook processed successfully',
    })
    async handleWebhook(@Body() webhookData: WebhookTypeDTO) {
        return this.paymentsService.verifyWebhook(webhookData);
    }

    @Get('callback/success')
    @ApiOperation({
        summary: 'Payment success callback',
        description: 'Callback từ PayOS khi thanh toán thành công',
    })
    async handleSuccessCallback(
        @Query('orderCode') orderCode: string,
        @Res() res: Response,
    ) {
        if (!orderCode) {
            throw new BadRequestException('Missing orderCode parameter');
        }
        const result =
            await this.paymentsService.handleSuccessCallback(orderCode);
        return res.redirect(result.redirectUrl);
    }

    @Get('callback/cancel')
    @ApiOperation({
        summary: 'Payment cancel callback',
        description: 'Callback từ PayOS khi thanh toán bị hủy',
    })
    async handleCancelCallback(
        @Query('orderCode') orderCode: string,
        @Res() res: Response,
    ) {
        if (!orderCode) {
            throw new BadRequestException('Missing orderCode parameter');
        }
        const result =
            await this.paymentsService.handleCancelCallback(orderCode);
        return res.redirect(result.redirectUrl);
    }

    @Get('available-packages')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get available service packages',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Available packages retrieved successfully',
        type: GetPayablePackagesDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ResponseMessage('Lấy danh sách gói dịch vụ thành công')
    getAvailablePackages(@Query() query: GetPayablePackagesDto) {
        return this.paymentServicesService.getAvailablePackages(query);
    }

    @Get('available-services')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get available services',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Available services retrieved successfully',
        type: GetPayablePackagesDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ResponseMessage('Lấy danh sách dịch vụ thành công')
    getAvailableServices(@Query() query: GetPayablePackagesDto) {
        return this.paymentServicesService.getAvailableServices(query);
    }

    @Get('pending-appointments')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get pending appointments',
        description: 'Lấy danh sách cuộc hẹn chờ thanh toán của tài khoản này',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Pending appointments retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ResponseMessage('Lấy danh sách cuộc hẹn chờ thanh toán thành công')
    getPendingAppointments(@CurrentUser() currentUser: User) {
        return this.paymentsService.getPendingAppointments(currentUser.id);
    }

    @Get('user-stats')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get user payment statistics',
        description: 'Lấy thống kê thanh toán của tài khoản này',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User payment statistics retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ResponseMessage('Lấy thống kê thanh toán thành công')
    getUserPaymentStats(@CurrentUser() currentUser: User) {
        return this.paymentsService.getUserPaymentStats(currentUser.id);
    }

    @Get('my-payments')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get my payments',
        description: 'Lấy danh sách thanh toán của tài khoản này',
    })
    @ApiQuery({
        name: 'status',
        enum: PaymentStatusType,
        required: false,
        description: 'Lọc theo trạng thái thanh toán',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User payments retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ResponseMessage('Lấy danh sách thanh toán thành công')
    getMyPayments(
        @CurrentUser() currentUser: User,
        @Query('status') status?: PaymentStatusType,
    ) {
        return this.paymentsService.getUserPayments(currentUser.id, status);
    }

    @Get('admin/all')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Get all payments',
        description:
            'Lấy tất cả thanh toán trong hệ thống - chỉ dành cho admin, manager',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'All payments retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Forbidden access - admin or manager only',
    })
    @ResponseMessage('Lấy danh sách tất cả thanh toán thành công')
    findAll() {
        return this.paymentsService.findAll();
    }

    @Post('packages')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Create package payment',
        description: 'Tạo thanh toán cho gói dịch vụ',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Payment link created successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ResponseMessage('Tạo thanh toán gói dịch vụ thành công')
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
    @ApiOperation({
        summary: 'Create appointment payment',
        description: 'Tạo thanh toán cho cuộc hẹn',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Payment link created successfully',
    })
    @ResponseMessage('Tạo thanh toán cuộc hẹn thành công')
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
    @ApiOperation({
        summary: 'Create service payment',
        description: 'Tạo thanh toán cho dịch vụ đơn lẻ',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Payment link created successfully',
    })
    @ResponseMessage('Tạo thanh toán dịch vụ thành công')
    createServicePayment(
        @Body() createDto: CreateServicePaymentDto,
        @CurrentUser() currentUser: User,
    ) {
        return this.paymentsService.createServicePayment(
            createDto,
            currentUser.id,
        );
    }

    @Get(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({
        summary: 'Get payment by ID (Admin, Manager only)',
        description: 'Lấy thanh toán theo ID - chỉ dành cho admin, manager',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Payment details retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Payment not found or access denied',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Forbidden access - admin or manager only',
    })
    @ResponseMessage('Lấy thông tin thanh toán thành công')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.paymentsService.findOne(id);
    }

    @Get(':id/details')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get payment details',
        description: 'Lấy chi tiết thanh toán của tài khoản này',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Payment details retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Payment not found or access denied',
    })
    @ResponseMessage('Lấy chi tiết thanh toán thành công')
    getMyPaymentDetails(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.paymentsService.getUserPaymentDetails(id, currentUser.id);
    }

    @Get(':id/status')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Check payment status',
        description: 'Kiểm tra trạng thái thanh toán của tài khoản này',
    })
    @ResponseMessage('Kiểm tra trạng thái thanh toán thành công')
    checkMyPaymentStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ) {
        return this.paymentsService.checkUserPaymentStatus(id, currentUser.id);
    }

    @Patch(':id/cancel')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Cancel payment',
        description: 'Hủy thanh toán đang chờ xử lý',
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
                data: { type: 'object' },
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
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ResponseMessage('Hủy thanh toán thành công')
    cancelPayment(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
        @Body() cancelDto: CancelPaymentDto,
    ) {
        return this.paymentsService.cancelPaymentByUser(
            id,
            currentUser.id,
            cancelDto,
        );
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles([RolesNameEnum.ADMIN])
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Payment deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Payment not found',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Forbidden access - admin only',
    })
    @ApiOperation({
        summary: 'Delete payment (Admin only)',
        description: 'Xóa thanh toán - chỉ dành cho admin',
    })
    @ResponseMessage('Xóa thanh toán thành công')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.paymentsService.remove(id);
    }

    @Get('*path')
    @ApiOperation({
        summary: 'Catch invalid routes',
        description: 'Bắt các route không hợp lệ',
    })
    handleInvalidRoutes() {
        throw new BadRequestException(
            'Endpoint không hợp lệ. Vui lòng kiểm tra lại URL và tham số.',
        );
    }
}