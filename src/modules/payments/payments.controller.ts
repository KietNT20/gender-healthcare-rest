import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post()
    create(
        @Body() createPaymentDto: CreatePaymentDto,
        @CurrentUser() currentUser: User,
    ) {
        console.log('Tạo thanh toán:', createPaymentDto);
        return this.paymentsService.create(createPaymentDto, currentUser);
    }

    @Get()
    findAll() {
        console.log('Lấy tất cả thanh toán');
        return this.paymentsService.findAll();
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
    @Get('cancel')
    async handleCancel(@Query() query: any) {
        console.log('Nhận callback hủy:', query);
        const { orderCode, status, cancel } = query;

        if (!orderCode || status !== 'CANCELLED' || cancel !== 'true') {
            throw new BadRequestException('Tham số callback hủy không hợp lệ');
        }
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

    @Get('cancel/*')
    async handleInvalidCancel() {
        throw new BadRequestException(
            'Yêu cầu hủy không hợp lệ. Vui lòng sử dụng đúng URL /payments/cancel với các tham số query hợp lệ.',
        );
    }
    @Get('cancel/*')
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
            const payment = await this.paymentsService.handleSuccessCallback(
                orderCode,
                currentUser,
            );
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

