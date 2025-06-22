import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import PayOS = require('@payos/node');
import { validate as isUUID } from 'uuid';
import * as crypto from 'crypto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentStatusType } from 'src/enums';
import { Appointment } from '../appointments/entities/appointment.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
    private payOS: PayOS;

    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(Appointment)
        private appointmentRepository: Repository<Appointment>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
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

    async create(createPaymentDto: CreatePaymentDto, currentUser: User) {
        if (!currentUser || !currentUser.id) {
            throw new BadRequestException(
                'Người dùng hiện tại không hợp lệ hoặc chưa được xác thực',
            );
        }
        const { description, appointmentId } = createPaymentDto;

        const userId = currentUser.id;

        // Kiểm tra quyền truy cập: Chỉ cho phép người dùng hiện tại tạo thanh toán cho chính họ
        if (userId !== currentUser.id) {
            throw new BadRequestException(
                'Bạn chỉ có thể tạo thanh toán cho chính mình',
            );
        }

        // Kiểm tra userId
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: IsNull() },
        });
        if (!user) {
            throw new NotFoundException(`User with ID '${userId}' not found`);
        }

        // Kiểm tra và đảm bảo appointmentId là string
        if (!appointmentId) {
            throw new NotFoundException('appointmentId is required');
        }

        // Kiểm tra quyền truy cập: Chỉ cho phép người dùng liên quan đến cuộc hẹn
        const appointment = await this.appointmentRepository.findOne({
            where: {
                id: appointmentId,
                deletedAt: IsNull(),
                user: { id: userId },
            },
        });
        if (!appointment) {
            throw new NotFoundException(
                `Appointment with ID '${appointmentId}' not found or not accessible`,
            );
        }

        // Lấy fixedPrice từ Appointment
        let finalAmount =
            appointment.fixedPrice ||
            (await this.appointmentsService.calculateTotalPrice(
                appointmentId,
                currentUser,
            ));

        // Chuyển đổi finalAmount thành số và chuẩn hóa
        finalAmount = parseFloat(finalAmount.toString());
        if (isNaN(finalAmount)) {
            throw new BadRequestException(
                'Invalid amount: Unable to parse amount as a number.',
            );
        }
        finalAmount = Number(finalAmount.toFixed(2)); // Làm tròn đến 2 chữ số thập phân

        // Kiểm tra giới hạn của PayOS
        if (finalAmount < 0.01 || finalAmount > 10000000000) {
            throw new BadRequestException(
                `Invalid amount: ${finalAmount}. Amount must be between 0.01 and 10,000,000,000 VND.`,
            );
        }

        // Rút ngắn description (tối đa 25 ký tự)
        const shortDescription = (
            description ||
            `Thanh toán cuộc hẹn: ${appointment.notes || 'Cuộc hẹn'}`
        ).slice(0, 25);

        // Tạo mã đơn hàng duy nhất
        const orderCode = Math.floor(Math.random() * 1000000);

        // Tạo dữ liệu thanh toán theo tài liệu PayOS
        const paymentData = {
            orderCode,
            amount: finalAmount,
            description: shortDescription,
            returnUrl:
                process.env.RETURN_URL ||
                'http://localhost:3333/payments/success',
            cancelUrl:
                process.env.CANCEL_URL ||
                'http://localhost:3333/payments/cancel',
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
            throw new BadRequestException(
                `Failed to create payment link: ${error.message}`,
            );
        }
    }

    async handleSuccessCallback(orderCode: string, currentUser: User) {
        console.log(`Xử lý callback thành công cho orderCode: ${orderCode}`);
        try {
            const payment = await this.paymentRepository.findOne({
                where: { invoiceNumber: orderCode.toString() },
                relations: ['user', 'appointment'],
            });

            if (!payment) {
                throw new NotFoundException(
                    `Không tìm thấy thanh toán với orderCode '${orderCode}'`,
                );
            }

            // Kiểm tra quyền truy cập: Chỉ cho phép người dùng liên quan
            if (
                payment.user.id !== currentUser.id &&
                !currentUser.role.name.includes('ADMIN')
            ) {
                throw new BadRequestException(
                    'Bạn không có quyền truy cập thanh toán này',
                );
            }

            if (payment.status !== PaymentStatusType.PENDING) {
                throw new BadRequestException(
                    `Thanh toán đã ở trạng thái ${payment.status}, không thể xử lý lại`,
                );
            }

            // Xác minh trạng thái với PayOS
            const paymentInfo =
                await this.payOS.getPaymentLinkInformation(orderCode);
            console.log('Thông tin thanh toán từ PayOS:', paymentInfo);

            if (paymentInfo.status === 'PAID') {
                payment.status = PaymentStatusType.COMPLETED;
                payment.paymentDate = new Date();
                payment.gatewayResponse = {
                    ...payment.gatewayResponse,
                    payosStatus: 'PAID',
                    paymentConfirmedAt: new Date().toISOString(),
                };
                await this.paymentRepository.save(payment);
                console.log(
                    `Cập nhật thanh toán ${orderCode} thành completed thành công`,
                );
            } else {
                throw new BadRequestException(
                    `Trạng thái thanh toán trên PayOS là ${paymentInfo.status}, mong đợi PAID`,
                );
            }

            return payment;
        } catch (error) {
            console.error(
                'Lỗi xử lý callback thành công:',
                error.message,
                error.stack,
            );
            throw new BadRequestException(
                `Không thể xử lý callback thành công: ${error.message}`,
            );
        }
    }

    async handleCancelCallback(orderCode: string) {
        console.log(`Xử lý callback hủy cho orderCode: ${orderCode}`);
        try {
            const payment = await this.paymentRepository.findOne({
                where: { invoiceNumber: orderCode.toString() },
                relations: ['user', 'appointment'],
            });

            if (!payment) {
                throw new NotFoundException(
                    `Không tìm thấy thanh toán với orderCode '${orderCode}'`,
                );
            }

            // Loại bỏ kiểm tra quyền truy cập dựa trên currentUser
            if (payment.status !== PaymentStatusType.PENDING) {
                throw new BadRequestException(
                    `Thanh toán đã ở trạng thái ${payment.status}`,
                );
            }

            // Xác minh trạng thái với PayOS
            const paymentInfo =
                await this.payOS.getPaymentLinkInformation(orderCode);
            console.log('Thông tin thanh toán từ PayOS:', paymentInfo);
            if (paymentInfo.status !== 'CANCELLED') {
                throw new BadRequestException(
                    `Trạng thái thanh toán trên PayOS là ${paymentInfo.status}, mong đợi CANCELLED`,
                );
            }

            // Ánh xạ CANCELLED thành FAILED và lưu thông tin hủy
            payment.status = PaymentStatusType.FAILED;
            payment.gatewayResponse = {
                ...paymentInfo,
                payosStatus: 'CANCELLED',
                cancelledAt: new Date().toISOString(),
                cancellationReason: 'Hủy bởi người dùng qua giao diện PayOS',
            };
            await this.paymentRepository.save(payment);

            console.log(`Hủy thanh toán ${orderCode} thành công`);
            return payment;
        } catch (error) {
            console.error(
                'Lỗi xử lý callback hủy:',
                error.message,
                error.stack,
            );
            throw new BadRequestException(
                `Không thể xử lý callback hủy: ${error.message}`,
            );
        }
    }

    async verifyWebhook(webhookData: any) {
        console.log('Nhận webhook:', webhookData);
        try {
            const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
            if (!checksumKey) {
                throw new Error('Thiếu khóa checksum trong file .env');
            }

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
                throw new Error('Chữ ký webhook không hợp lệ');
            }

            const { orderCode, status } = webhookData;
            const payment = await this.paymentRepository.findOne({
                where: { invoiceNumber: orderCode.toString() },
            });

            if (!payment) {
                throw new Error('Không tìm thấy thanh toán');
            }

            // Ánh xạ trạng thái từ PayOS
            payment.status =
                status === 'PAID'
                    ? PaymentStatusType.COMPLETED
                    : PaymentStatusType.FAILED; // Ánh xạ CANCELLED thành FAILED
            payment.paymentDate =
                status === 'PAID' ? new Date() : payment.paymentDate;
            payment.gatewayResponse = {
                ...webhookData,
                payosStatus: status,
                ...(status === 'CANCELLED' && {
                    cancelledAt: new Date().toISOString(),
                    cancellationReason:
                        webhookData.cancellationReason ||
                        'Hủy qua webhook PayOS',
                }),
            };
            await this.paymentRepository.save(payment);

            console.log(`Xử lý webhook cho orderCode ${orderCode} thành công`);
            return payment;
        } catch (error) {
            console.error('Lỗi webhook:', error.message, error.stack);
            throw new Error(`Lỗi webhook: ${error.message}`);
        }
    }

    async findAll() {
        return this.paymentRepository.find({
            relations: ['user', 'appointment'],
        });
    }

    async findOne(id: string) {
        console.log(`Gọi findOne với id: ${id}`); // Thêm logging
        if (!isUUID(id)) {
            throw new BadRequestException(`UUID không hợp lệ: ${id}`);
        }
        const payment = await this.paymentRepository.findOne({
            where: { id },
            relations: ['user', 'appointment'],
        });
        if (!payment) {
            throw new NotFoundException(
                `Không tìm thấy thanh toán với ID '${id}'`,
            );
        }
        return payment;
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
