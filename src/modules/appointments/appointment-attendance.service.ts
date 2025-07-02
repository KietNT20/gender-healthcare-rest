import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { AppointmentStatusType } from 'src/enums';
import { In, Repository } from 'typeorm';
import { Service } from '../services/entities/service.entity';
import { AppointmentNotificationService } from './appointment-notification.service';
import {
    CheckInAppointmentDto,
    CheckInResponseDto,
} from './dto/check-in-appointment.dto';
import {
    LateCheckInDto,
    LateCheckInResponseDto,
} from './dto/late-check-in.dto';
import { MarkNoShowDto, NoShowProcessResult } from './dto/mark-no-show.dto';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentAttendanceService {
    private readonly logger = new Logger(AppointmentAttendanceService.name);

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        private readonly notificationService: AppointmentNotificationService,
    ) {}

    /**
     * Check-in bệnh nhân tại cơ sở
     */
    async checkInPatient(
        appointmentId: string,
        checkInData: CheckInAppointmentDto,
    ): Promise<CheckInResponseDto> {
        const appointment = await this.findAppointmentById(appointmentId);

        // Validation
        this.validateAppointmentForCheckIn(appointment);

        // Cập nhật check-in time
        const checkInTime = checkInData.checkInTime || new Date();
        appointment.checkInTime = checkInTime;
        appointment.status = AppointmentStatusType.CHECKED_IN;

        // Xử lý actualServices nếu có
        if (
            checkInData.actualServices &&
            checkInData.actualServices.length > 0
        ) {
            const actualServices = await this.serviceRepository.findBy({
                id: In(checkInData.actualServices),
            });
            if (actualServices.length !== checkInData.actualServices.length) {
                throw new BadRequestException('Một số dịch vụ không tồn tại');
            }
            appointment.services = actualServices;
        }

        // Thêm notes nếu có
        if (checkInData.notes) {
            appointment.notes = appointment.notes
                ? `${appointment.notes}\n[Check-in] ${checkInData.notes}`
                : `[Check-in] ${checkInData.notes}`;
        }

        await this.appointmentRepository.save(appointment);

        // Tính toán thời gian chờ ước tính
        const estimatedWaitTime =
            await this.calculateEstimatedWaitTime(appointment);

        // Gửi thông báo cho staff
        await this.notificationService.sendCheckInNotification(appointment);

        this.logger.log(`Appointment ${appointmentId} checked in successfully`);

        return {
            appointmentId: appointment.id,
            checkInTime,
            estimatedWaitTime,
            assignedRoom: this.assignRoom(appointment),
            nextSteps: this.getNextSteps(appointment),
            status: appointment.status,
        };
    }

    /**
     * Đánh dấu no-show thủ công
     */
    async markNoShow(
        appointmentId: string,
        noShowData: MarkNoShowDto,
    ): Promise<NoShowProcessResult> {
        const appointment = await this.findAppointmentById(appointmentId);

        // Validation
        this.validateAppointmentForNoShow(appointment);

        // Cập nhật status và thông tin no-show
        appointment.status = AppointmentStatusType.NO_SHOW;
        appointment.cancellationReason = noShowData.reason;

        // Thêm notes về no-show
        const noShowNote = `[No-Show] Reason: ${noShowData.reason}`;
        if (noShowData.contactAttempts) {
            appointment.notes = `${noShowNote}. Contact attempts: ${noShowData.contactAttempts}`;
        }
        if (noShowData.notes) {
            appointment.notes += `. Additional notes: ${noShowData.notes}`;
        }

        await this.appointmentRepository.save(appointment);

        // Gửi thông báo no-show
        await this.notificationService.sendNoShowNotification(appointment);

        // Giải phóng tài nguyên
        await this.releaseAppointmentResources(appointment);

        this.logger.log(`Appointment ${appointmentId} marked as no-show`);

        return {
            appointmentId: appointment.id,
            reason: noShowData.reason,
            notificationSent: true,
            status: appointment.status,
        };
    }

    /**
     * Xử lý check-in trễ
     */
    async processLateCheckIn(
        appointmentId: string,
        lateData: LateCheckInDto,
    ): Promise<LateCheckInResponseDto> {
        const appointment = await this.findAppointmentById(appointmentId);

        // Validation
        this.validateAppointmentForCheckIn(appointment);

        const scheduledTime = appointment.appointmentDate;
        const actualArrival = lateData.actualArrivalTime;
        const lateMinutes = Math.max(
            0,
            Math.floor(
                (actualArrival.getTime() - scheduledTime.getTime()) /
                    (1000 * 60),
            ),
        );

        // Kiểm tra xem có quá threshold hủy không (60 phút)
        if (lateMinutes > 60) {
            throw new BadRequestException(
                'Đến trễ quá 60 phút. Lịch hẹn đã bị hủy tự động.',
            );
        }

        // Cập nhật appointment
        appointment.checkInTime = actualArrival;
        appointment.status = AppointmentStatusType.CHECKED_IN;

        // Xử lý adjusted services
        if (lateData.adjustedServices && lateData.adjustedServices.length > 0) {
            const adjustedServices = await this.serviceRepository.findBy({
                id: In(lateData.adjustedServices),
            });
            appointment.services = adjustedServices;
        }

        // Thêm notes về late arrival
        const lateNote = `[Late Check-in] Arrived ${lateMinutes} minutes late.`;
        appointment.notes = appointment.notes
            ? `${appointment.notes}\n${lateNote}`
            : lateNote;

        if (lateData.notes) {
            appointment.notes += ` Notes: ${lateData.notes}`;
        }

        await this.appointmentRepository.save(appointment);

        // Gửi thông báo late arrival
        await this.notificationService.sendLateArrivalNotification(appointment);

        const estimatedWaitTime =
            await this.calculateEstimatedWaitTime(appointment);
        const warnings = this.generateLateArrivalWarnings(lateMinutes);

        this.logger.log(
            `Late check-in processed for appointment ${appointmentId}`,
        );

        return {
            appointmentId: appointment.id,
            actualArrivalTime: actualArrival,
            adjustedServices: lateData.adjustedServices || [],
            estimatedWaitTime,
            status: appointment.status,
            warnings,
        };
    }

    /**
     * Tự động hủy lịch hẹn trễ (chạy mỗi 15 phút)
     */
    @Cron('*/15 * * * *')
    async autoProcessLateAppointments(): Promise<void> {
        this.logger.log('Running auto late appointment processing...');

        const cutoffTime = new Date();
        cutoffTime.setMinutes(cutoffTime.getMinutes() - 60); // 60 phút trước

        try {
            const lateAppointments = await this.appointmentRepository
                .createQueryBuilder('appointment')
                .where('appointment.appointmentDate < :cutoffTime', {
                    cutoffTime,
                })
                .andWhere('appointment.status IN (:...statuses)', {
                    statuses: [
                        AppointmentStatusType.CONFIRMED,
                        AppointmentStatusType.PENDING,
                    ],
                })
                .andWhere('appointment.checkInTime IS NULL')
                .getMany();

            for (const appointment of lateAppointments) {
                await this.processAutoCancellation(appointment);
            }

            this.logger.log(
                `Processed ${lateAppointments.length} late appointments`,
            );
        } catch (error) {
            this.logger.error(
                'Error in auto late appointment processing:',
                error,
            );
        }
    }

    /**
     * Gửi reminder trước appointment (chạy mỗi giờ)
     */
    @Cron('0 */1 * * *')
    async sendPreAppointmentReminders(): Promise<void> {
        this.logger.log('Sending pre-appointment reminders...');

        try {
            // Reminder 24 giờ trước
            await this.sendRemindersForTimeframe(24 * 60);
            // Reminder 2 giờ trước
            await this.sendRemindersForTimeframe(2 * 60);
            // Reminder 30 phút trước
            await this.sendRemindersForTimeframe(30);
        } catch (error) {
            this.logger.error(
                'Error sending pre-appointment reminders:',
                error,
            );
        }
    }

    // Private helper methods

    private async findAppointmentById(
        appointmentId: string,
    ): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId },
            relations: {
                user: true,
                consultant: true,
                services: true,
                payments: true,
            },
        });

        if (!appointment) {
            throw new NotFoundException(
                `Appointment with ID ${appointmentId} not found`,
            );
        }

        return appointment;
    }

    private validateAppointmentForCheckIn(appointment: Appointment): void {
        const validStatuses = [
            AppointmentStatusType.CONFIRMED,
            AppointmentStatusType.PENDING,
        ];

        if (!validStatuses.includes(appointment.status)) {
            throw new BadRequestException(
                `Cannot check-in appointment with status: ${appointment.status}`,
            );
        }

        if (appointment.checkInTime) {
            throw new BadRequestException('Appointment already checked in');
        }
    }

    private validateAppointmentForNoShow(appointment: Appointment): void {
        const invalidStatuses = [
            AppointmentStatusType.COMPLETED,
            AppointmentStatusType.CANCELLED,
            AppointmentStatusType.NO_SHOW,
            AppointmentStatusType.CHECKED_IN,
            AppointmentStatusType.IN_PROGRESS,
        ];

        if (invalidStatuses.includes(appointment.status)) {
            throw new BadRequestException(
                `Cannot mark no-show for appointment with status: ${appointment.status}`,
            );
        }
    }

    private async calculateEstimatedWaitTime(
        appointment: Appointment,
    ): Promise<number> {
        // Logic tính toán thời gian chờ dự kiến dựa trên appointment cụ thể
        const baseWaitTime = 15; // 15 phút cơ bản

        // Lấy số lượng appointments đang chờ trước appointment này
        const queueLength = await this.getQueueLength(appointment);

        // Tính thời gian dự kiến dựa trên services của appointment
        const serviceTime = this.calculateServiceTime(appointment);

        // Tính thời gian chờ: base + (queue * thời gian service trung bình)
        const estimatedTime = baseWaitTime + queueLength * serviceTime;

        return Math.max(estimatedTime, 5); // Tối thiểu 5 phút
    }

    private async getQueueLength(
        currentAppointment: Appointment,
    ): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.appointmentRepository
            .createQueryBuilder('appointment')
            .where('appointment.status = :status', {
                status: AppointmentStatusType.CHECKED_IN,
            })
            .andWhere('appointment.appointmentDate >= :today', { today })
            .andWhere('appointment.appointmentDate < :tomorrow', { tomorrow })
            .andWhere('appointment.checkInTime <= :currentCheckIn', {
                currentCheckIn: currentAppointment.checkInTime || new Date(),
            })
            .getCount();
    }

    private calculateServiceTime(appointment: Appointment): number {
        if (!appointment.services || appointment.services.length === 0) {
            return 20; // Thời gian mặc định 20 phút
        }

        // Tính tổng thời gian dự kiến của các services
        let totalTime = 0;
        for (const service of appointment.services) {
            // Service entity có duration field (phút)
            totalTime += service.duration;
        }

        return Math.max(totalTime, 10); // Tối thiểu 10 phút
    }

    private assignRoom(appointment: Appointment): string | undefined {
        // Logic phân bổ phòng khám
        // Có thể dựa trên loại dịch vụ, availability của phòng, etc.
        const serviceTypes =
            appointment.services?.map((s) => s.category?.type) || [];
        if (serviceTypes.includes('CONSULTATION')) {
            return `Room-C${Math.floor(Math.random() * 5) + 1}`; // Room C1-C5
        }
        return `Room-G${Math.floor(Math.random() * 3) + 1}`; // Room G1-G3
    }

    private getNextSteps(appointment: Appointment): string[] {
        const steps = ['Vui lòng ngồi chờ trong khu vực chờ'];

        if (
            appointment.services?.some((s) => s.category?.type === 'LAB_TEST')
        ) {
            steps.push('Chuẩn bị cho xét nghiệm (nhịn ăn nếu cần)');
        }

        if (
            appointment.services?.some(
                (s) => s.category?.type === 'CONSULTATION',
            )
        ) {
            steps.push('Chuẩn bị danh sách câu hỏi cần tư vấn');
        }

        steps.push('Bạn sẽ được gọi khi đến lượt');
        return steps;
    }

    private generateLateArrivalWarnings(lateMinutes: number): string[] {
        const warnings: string[] = [];

        if (lateMinutes > 30) {
            warnings.push('Thời gian tư vấn có thể bị rút ngắn do đến trễ');
        }

        if (lateMinutes > 45) {
            warnings.push('Lịch hẹn sẽ bị hủy tự động nếu đến trễ quá 60 phút');
        }

        return warnings;
    }

    private async releaseAppointmentResources(
        appointment: Appointment,
    ): Promise<void> {
        // Logic giải phóng tài nguyên (phòng khám, thiết bị, etc.)
        this.logger.log(`Released resources for appointment ${appointment.id}`);
    }

    private async processAutoCancellation(
        appointment: Appointment,
    ): Promise<void> {
        try {
            appointment.status = AppointmentStatusType.CANCELLED;
            appointment.cancellationReason =
                'Auto-cancelled: Arrived more than 60 minutes late';

            await this.appointmentRepository.save(appointment);
            await this.notificationService.sendNoShowNotification(appointment);
            await this.releaseAppointmentResources(appointment);

            this.logger.log(
                `Auto-cancelled late appointment ${appointment.id}`,
            );
        } catch (error) {
            this.logger.error(
                `Error auto-cancelling late appointment ${appointment.id}:`,
                error,
            );
        }
    }

    private async sendRemindersForTimeframe(
        minutesBefore: number,
    ): Promise<void> {
        const targetTime = new Date();
        targetTime.setMinutes(targetTime.getMinutes() + minutesBefore);

        const appointments = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .where('appointment.appointmentDate BETWEEN :start AND :end', {
                start: new Date(targetTime.getTime() - 5 * 60 * 1000), // 5 phút trước target
                end: new Date(targetTime.getTime() + 5 * 60 * 1000), // 5 phút sau target
            })
            .andWhere('appointment.status IN (:...statuses)', {
                statuses: [
                    AppointmentStatusType.CONFIRMED,
                    AppointmentStatusType.PENDING,
                ],
            })
            .andWhere(
                'appointment.reminderSent = false OR appointment.reminderSent IS NULL',
            )
            .getMany();

        for (const appointment of appointments) {
            try {
                await this.notificationService.sendAppointmentReminder(
                    appointment,
                    minutesBefore,
                );
                appointment.reminderSent = true;
                appointment.reminderSentAt = new Date();
                await this.appointmentRepository.save(appointment);
            } catch (error) {
                this.logger.error(
                    `Error sending reminder for appointment ${appointment.id}:`,
                    error,
                );
            }
        }

        this.logger.log(
            `Sent ${appointments.length} reminders for ${minutesBefore} minutes timeframe`,
        );
    }
}
