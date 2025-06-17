import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PayOS = require("@payos/node"); // Sử dụng named export
import * as crypto from 'crypto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentStatusType } from 'src/enums';

@Injectable()
export class PaymentsService {
  private payOS: PayOS;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
      throw new Error('Missing PayOS credentials in .env file');
    }

    this.payOS = new PayOS(clientId, apiKey, checksumKey);
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const { amount, description, userId, appointmentId } = createPaymentDto;

    // Tạo mã đơn hàng duy nhất
    const orderCode = Math.floor(Math.random() * 1000000);

    // Tạo dữ liệu thanh toán theo tài liệu PayOS
    const paymentData = {
      orderCode,
      amount,
      description: description || 'Thanh toán đơn hàng',
      returnUrl: process.env.RETURN_URL || 'http://localhost:3333/payments/success',
      cancelUrl: process.env.CANCEL_URL || 'http://localhost:3333/payments/cancel',
      items: [
        {
          name: description || 'Sản phẩm',
          quantity: 1,
          price: amount,
        },
      ],
    };

    try {
      // Gọi API tạo link thanh toán
      const paymentLink = await this.payOS.createPaymentLink(paymentData);

      // Lưu thông tin thanh toán vào database
      const payment = this.paymentRepository.create({
        amount,
        paymentMethod: 'PayOS',
        status: PaymentStatusType.PENDING,
        invoiceNumber: orderCode.toString(),
        user: { id: userId } as any,
        appointment: appointmentId ? { id: appointmentId } as any : null,
        gatewayResponse: paymentLink,
      });

      await this.paymentRepository.save(payment);

      return {
        paymentId: payment.id,
        checkoutUrl: paymentLink.checkoutUrl,
      };
    } catch (error) {
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  }

  async verifyWebhook(webhookData: any) {
    try {
      // Lấy checksumKey từ biến môi trường và kiểm tra
      const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
      if (!checksumKey) {
        throw new Error('Checksum key is not defined in .env file');
      }

      // Xác minh chữ ký webhook
      const { signature, ...data } = webhookData;
      const sortedData = Object.keys(data)
        .sort()
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});
      const dataStr = JSON.stringify(sortedData);
      const calculatedSignature = crypto
        .createHmac('sha256', checksumKey)
        .update(dataStr)
        .digest('hex');

      if (calculatedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      // Xử lý dữ liệu webhook
      const { orderCode, status } = webhookData;
      const payment = await this.paymentRepository.findOne({
        where: { invoiceNumber: orderCode.toString() },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Cập nhật trạng thái thanh toán
      payment.status =
        status === 'PAID' ? PaymentStatusType.COMPLETED : PaymentStatusType.FAILED;
      payment.paymentDate = new Date();
      payment.gatewayResponse = webhookData;

      await this.paymentRepository.save(payment);
      return payment;
    } catch (error) {
      throw new Error(`Webhook error: ${error.message}`);
    }
  }

  async findAll() {
    return this.paymentRepository.find({ relations: ['user', 'appointment'] });
  }

  async findOne(id: string) {
    return this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'appointment'],
    });
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new Error('Payment not found');
    }
    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: string) {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new Error('Payment not found');
    }
    return this.paymentRepository.softDelete({ id });
  }

  async findOneByInvoiceNumber(invoiceNumber: string) {
    return this.paymentRepository.findOne({
      where: { invoiceNumber },
      relations: ['user', 'appointment'],
    });
  }
}