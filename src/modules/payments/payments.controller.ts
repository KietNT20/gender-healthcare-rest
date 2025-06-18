import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
  } from '@nestjs/common';
  import { PaymentsService } from './payments.service';
  import { CreatePaymentDto } from './dto/create-payment.dto';
  import { UpdatePaymentDto } from './dto/update-payment.dto';
  
  @Controller('payments')
  export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}
  
    @Post()
    create(@Body() createPaymentDto: CreatePaymentDto) {
      return this.paymentsService.create(createPaymentDto);
    }
  
    @Get()
    findAll() {
      return this.paymentsService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.paymentsService.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
      return this.paymentsService.update(id, updatePaymentDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.paymentsService.remove(id);
    }
  
    @Get('success')
    async handleSuccess(@Query() query: any) {
      // Xử lý callback khi thanh toán thành công
      const { orderCode } = query;
      const payment = await this.paymentsService.findOneByInvoiceNumber(orderCode);
      if (payment) {
        return { message: 'Payment successful', payment };
      }
      return { message: 'Payment not found', data: query };
    }
  
    @Get('cancel')
    async handleCancel(@Query() query: any) {
      // Xử lý callback khi hủy thanh toán
      return { message: 'Payment cancelled', data: query };
    }
  
    @Post('webhook')
    async handleWebhook(@Body() webhookData: any) {
      const payment = await this.paymentsService.verifyWebhook(webhookData);
      return { message: 'Webhook processed', payment };
    }
  }