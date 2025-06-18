import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import PayOS = require('@payos/node');
import * as crypto from 'crypto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentStatusType } from 'src/enums';
import { Appointment } from '../appointments/entities/appointment.entity';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class PaymentsService {
  private payOS: PayOS;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private appointmentsService: AppointmentsService,
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
    const { description, userId, appointmentId } = createPaymentDto;

    // Kiểm tra và đảm bảo appointmentId là string
    if (!appointmentId) {
      throw new NotFoundException('appointmentId is required');
    }

    // Lấy thông tin Appointment
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, deletedAt: IsNull() },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${appointmentId}' not found`);
    }

    // Lấy fixedPrice từ Appointment
    let finalAmount = appointment.fixedPrice || (await this.appointmentsService.calculateTotalPrice(appointmentId));

    // Chuyển đổi finalAmount thành số và chuẩn hóa
    finalAmount = parseFloat(finalAmount.toString());
    if (isNaN(finalAmount)) {
      throw new BadRequestException('Invalid amount: Unable to parse amount as a number.');
    }
    finalAmount = Number(finalAmount.toFixed(2)); // Làm tròn đến 2 chữ số thập phân

    // Kiểm tra giới hạn của PayOS
    if (finalAmount < 0.01 || finalAmount > 10000000000) {
      throw new BadRequestException(
        `Invalid amount: ${finalAmount}. Amount must be between 0.01 and 10,000,000,000 VND.`,
      );
    }

    // Rút ngắn description (tối đa 25 ký tự)
    const shortDescription =
      (description || `Thanh toán cuộc hẹn: ${appointment.notes || 'Cuộc hẹn'}`).slice(0, 25);

    // Tạo mã đơn hàng duy nhất
    const orderCode = Math.floor(Math.random() * 1000000);

    // Tạo dữ liệu thanh toán theo tài liệu PayOS
    const paymentData = {
      orderCode,
      amount: finalAmount,
      description: shortDescription,
      returnUrl: process.env.RETURN_URL || 'http://localhost:3333/payments/success',
      cancelUrl: process.env.CANCEL_URL || 'http://localhost:3333/payments/cancel',
      items: [
        {
          name: (appointment.notes || 'Cuộc hẹn').slice(0, 25), // Rút ngắn tên item
          quantity: 1,
          price: finalAmount, // Đảm bảo price khớp với amount
        },
      ],
    };

    try {
      // Gọi API tạo link thanh toán
      const paymentLink = await this.payOS.createPaymentLink(paymentData);

      // Lưu thông tin thanh toán vào database
      const payment = this.paymentRepository.create({
        amount: finalAmount,
        paymentMethod: 'PayOS',
        status: PaymentStatusType.PENDING,
        invoiceNumber: orderCode.toString(),
        user: { id: userId } as any,
        appointment: { id: appointmentId } as any,
        gatewayResponse: paymentLink,
      });

      await this.paymentRepository.save(payment);

      return {
        paymentId: payment.id,
        checkoutUrl: paymentLink.checkoutUrl,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create payment link: ${error.message}`);
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