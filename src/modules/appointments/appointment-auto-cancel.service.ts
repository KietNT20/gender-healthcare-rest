import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
    AppointmentStatusType,
    LocationTypeEnum,
    PaymentStatusType,
} from 'src/enums';
import { Between, Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentAutoCancelService {
    private readonly logger = new Logger(AppointmentAutoCancelService.name);

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
    ) {}

    @Cron('5 0 * * *') // Chạy lúc 00:05 mỗi ngày
    async handleAutoCancel() {
        const now = new Date();
        const yesterday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 1,
            0,
            0,
            0,
            0,
        );
        const endOfYesterday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 1,
            23,
            59,
            59,
            999,
        );

        const appointments = await this.appointmentRepository.find({
            where: {
                appointmentLocation: LocationTypeEnum.ONLINE,
                status: AppointmentStatusType.PENDING,
                createdAt: Between(yesterday, endOfYesterday),
            },
            relations: {
                payments: true,
            },
        });

        for (const appointment of appointments) {
            const totalPaid = (appointment.payments || [])
                .filter((p) => p.status === PaymentStatusType.COMPLETED)
                .reduce((sum, p) => sum + Number(p.amount), 0);

            if (totalPaid < Number(appointment.fixedPrice)) {
                appointment.status = AppointmentStatusType.CANCELLED;
                await this.appointmentRepository.save(appointment);
                this.logger.log(
                    `Auto-cancelled appointment ID: ${appointment.id}`,
                );
            }
        }
    }
}
