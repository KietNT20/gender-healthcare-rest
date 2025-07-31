import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentStatusType, SortOrder } from 'src/enums';
import { AppointmentsService } from 'src/modules/appointments/appointments.service';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { ServicePackage } from 'src/modules/service-packages/entities/service-package.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { IsNull, Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentRepositoryService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(ServicePackage)
        private readonly packageRepository: Repository<ServicePackage>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        private readonly appointmentsService: AppointmentsService,
    ) {}

    /**
     * Tạo payment mới
     */
    async createPayment(paymentData: {
        amount: number;
        paymentMethod: string;
        status: PaymentStatusType;
        invoiceNumber: string;
        userId: string;
        packageId?: string;
        appointmentId?: string;
        serviceId?: string;
        gatewayResponse: any;
    }) {
        const payment = this.paymentRepository.create({
            amount: paymentData.amount,
            paymentMethod: paymentData.paymentMethod,
            status: paymentData.status,
            invoiceNumber: paymentData.invoiceNumber,
            user: { id: paymentData.userId } as User,
            ...(paymentData.packageId && {
                servicePackage: { id: paymentData.packageId } as ServicePackage,
            }),
            ...(paymentData.appointmentId && {
                appointment: { id: paymentData.appointmentId } as Appointment,
            }),
            ...(paymentData.serviceId && {
                service: { id: paymentData.serviceId } as Service,
            }),
            gatewayResponse: paymentData.gatewayResponse,
        });

        return this.paymentRepository.save(payment);
    }

    /**
     * Tìm payment theo ID
     */
    async findPaymentById(id: string) {
        const payment = await this.paymentRepository.findOne({
            where: { id },
            relations: {
                user: true,
                servicePackage: true,
                appointment: true,
                service: true,
                packageSubscriptions: true,
            },
        });

        if (!payment) {
            throw new NotFoundException(
                `Không tìm thấy thanh toán với ID '${id}'`,
            );
        }

        return payment;
    }

    /**
     * Tìm payment theo invoice number
     */
    async findPaymentByInvoiceNumber(invoiceNumber: string) {
        return this.paymentRepository.findOne({
            where: { invoiceNumber },
            relations: [
                'user',
                'servicePackage',
                'appointment',
                'service',
                'packageSubscriptions',
            ],
        });
    }

    /**
     * Tìm payment theo ID và user ID (với check ownership)
     */
    async findPaymentByIdAndUser(paymentId: string, userId: string) {
        const payment = await this.paymentRepository.findOne({
            where: {
                id: paymentId,
                user: { id: userId },
                deletedAt: IsNull(),
            },
            relations: {
                user: true,
                servicePackage: true,
                appointment: true,
                service: true,
            },
        });

        if (!payment) {
            throw new NotFoundException(
                `Không tìm thấy thanh toán với ID '${paymentId}' hoặc bạn không có quyền truy cập`,
            );
        }

        return payment;
    }

    /**
     * Lấy tất cả payments
     */
    async findAllPayments() {
        return this.paymentRepository.find({
            relations: [
                'user',
                'servicePackage',
                'appointment',
                'service',
                'packageSubscriptions',
            ],
        });
    }

    /**
     * Lấy payments của user với filter status
     */
    async getUserPayments(userId: string, status?: PaymentStatusType) {
        return this.paymentRepository.find({
            where: {
                user: { id: userId },
                deletedAt: IsNull(),
                ...(status && { status }),
            },
            relations: {
                servicePackage: true,
                appointment: true,
                service: true,
            },
            order: { createdAt: SortOrder.DESC },
            select: {
                id: true,
                amount: true,
                paymentMethod: true,
                status: true,
                paymentDate: true,
                invoiceNumber: true,
                createdAt: true,
                updatedAt: true,
                servicePackage: {
                    id: true,
                    name: true,
                    description: true,
                },
                appointment: {
                    id: true,
                    appointmentDate: true,
                    notes: true,
                },
                service: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        });
    }

    /**
     * Cập nhật payment
     */
    async updatePayment(payment: Payment) {
        return this.paymentRepository.save(payment);
    }

    /**
     * Soft delete payment
     */
    async softDeletePayment(id: string) {
        const payment = await this.paymentRepository.findOneBy({ id });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
        return this.paymentRepository.softDelete({ id });
    }

    /**
     * Tìm package theo ID
     */
    async findPackageById(packageId: string) {
        const servicePackage = await this.packageRepository.findOne({
            where: { id: packageId, deletedAt: IsNull() },
            select: ['id', 'price', 'name'],
        });

        if (!servicePackage) {
            throw new NotFoundException(
                `Service package with ID '${packageId}' not found`,
            );
        }

        return servicePackage;
    }

    /**
     * Tìm service theo ID
     */
    async findServiceById(serviceId: string) {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId, deletedAt: IsNull(), isActive: true },
            select: ['id', 'price', 'name'],
        });

        if (!service) {
            throw new NotFoundException(
                `Service with ID '${serviceId}' not found or inactive`,
            );
        }

        return service;
    }

    /**
     * Tìm appointment theo ID và tính tổng giá
     */
    async findAppointmentWithPrice(appointmentId: string, user: User) {
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId, deletedAt: IsNull() },
        });

        if (!appointment) {
            throw new NotFoundException(
                `Appointment with ID '${appointmentId}' not found`,
            );
        }

        const totalPrice = await this.appointmentsService.calculateTotalPrice(
            appointmentId,
            user,
        );

        return { appointment, totalPrice };
    }

    /**
     * Lấy pending appointments của user
     */
    async getPendingAppointments(userId: string) {
        const appointments = await this.appointmentRepository.find({
            where: {
                user: { id: userId },
                deletedAt: IsNull(),
            },
            relations: {
                services: true,
                consultant: {
                    role: true,
                },
            },
            select: {
                id: true,
                appointmentDate: true,
                appointmentLocation: true,
                notes: true,
                fixedPrice: true,
                status: true,
            },
            order: { appointmentDate: SortOrder.ASC },
        });

        // Filter appointments that need payment
        const pendingPaymentAppointments: Appointment[] = [];
        for (const appointment of appointments) {
            const existingPayment = await this.paymentRepository.findOne({
                where: {
                    appointment: { id: appointment.id },
                    status: PaymentStatusType.COMPLETED,
                },
            });

            if (!existingPayment) {
                pendingPaymentAppointments.push(appointment);
            }
        }

        return pendingPaymentAppointments;
    }

    /**
     * Thống kê thanh toán của user
     */
    async getUserPaymentStats(userId: string) {
        // Tổng số tiền đã thanh toán
        const totalPaidResult = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('SUM(payment.amount)', 'total')
            .where('payment.user.id = :userId', { userId })
            .andWhere('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .getRawOne();

        // Số lượng thanh toán theo trạng thái
        const paymentsByStatus = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('payment.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('payment.user.id = :userId', { userId })
            .groupBy('payment.status')
            .getRawMany();

        // Số gói đã mua
        const packagesPurchased = await this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoin('payment.servicePackage', 'package')
            .where('payment.user.id = :userId', { userId })
            .andWhere('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .andWhere('payment.servicePackage IS NOT NULL')
            .getCount();

        // Số cuộc hẹn đã thanh toán
        const appointmentsPaid = await this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoin('payment.appointment', 'appointment')
            .where('payment.user.id = :userId', { userId })
            .andWhere('payment.status = :status', {
                status: PaymentStatusType.COMPLETED,
            })
            .andWhere('payment.appointment IS NOT NULL')
            .getCount();

        return {
            totalAmountPaid: Number(totalPaidResult?.total) || 0,
            paymentsByStatus: paymentsByStatus.reduce((acc, item) => {
                acc[item.status] = Number(item.count);
                return acc as Record<PaymentStatusType, number>;
            }, {}),
            packagesPurchased,
            appointmentsPaid,
        };
    }

    async findPendingPaymentByAppointmentId(
        appointmentId: string,
        userId: string,
    ) {
        return this.paymentRepository.findOne({
            where: {
                appointment: { id: appointmentId },
                user: { id: userId },
                status: PaymentStatusType.PENDING,
            },
            order: { createdAt: SortOrder.DESC },
        });
    }
}
