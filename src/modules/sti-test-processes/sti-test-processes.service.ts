import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { SortOrder } from 'src/enums';
import { Between, FindOptionsWhere, Like, Repository } from 'typeorm';
import { AppointmentsService } from '../appointments/appointments.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ServicesService } from '../services/services.service';
import { UsersService } from '../users/users.service';
import { CreateStiTestProcessDto } from './dto/create-sti-test-process.dto';
import { QueryStiTestProcessDto } from './dto/query-sti-test-process.dto';
import { StiTestProcessResponseDto } from './dto/sti-test-process-response.dto';
import { UpdateStiTestProcessDto } from './dto/update-sti-test-process.dto';
import { StiTestProcess } from './entities/sti-test-process.entity';
import { StiTestProcessStatus } from './enums';

@Injectable()
export class StiTestProcessesService {
    constructor(
        @InjectRepository(StiTestProcess)
        private readonly stiTestProcessRepository: Repository<StiTestProcess>,
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
        private readonly usersService: UsersService,
        private readonly servicesService: ServicesService,
        private readonly appointmentsService: AppointmentsService,
    ) {}
    /**
     * Tạo mã xét nghiệm ngẫu nhiên
     * @description Mã này bao gồm tiền tố "STI",
     * thời gian hiện tại và một chuỗi ngẫu nhiên để đảm bảo tính duy nhất.
     * @returns Mã xét nghiệm duy nhất
     */
    private generateTestCode(): string {
        const prefix = 'STI';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }

    /**
     * Tạo quá trình xét nghiệm STI mới
     */
    async create(
        createDto: CreateStiTestProcessDto,
    ): Promise<StiTestProcessResponseDto> {
        // Check data exist
        const patient = await this.usersService.findOne(createDto.patientId);
        if (!patient) {
            throw new NotFoundException(
                `Không tìm thấy bệnh nhân với ID: ${createDto.patientId}`,
            );
        }
        const service = await this.servicesService.findOne(createDto.serviceId);
        if (!service) {
            throw new NotFoundException(
                `Không tìm thấy dịch vụ với ID: ${createDto.serviceId}`,
            );
        }

        if (createDto.consultantDoctorId) {
            const consultantDoctor = await this.usersService.findOne(
                createDto.consultantDoctorId,
            );
            if (!consultantDoctor) {
                throw new NotFoundException(
                    `Không tìm thấy bác sĩ tư vấn với ID: ${createDto.consultantDoctorId}`,
                );
            }
        }

        if (createDto.appointmentId) {
            const appointment = await this.appointmentsService.findOneById(
                createDto.appointmentId,
            );

            if (!appointment) {
                throw new NotFoundException(
                    `Không tìm thấy cuộc hẹn với ID: ${createDto.appointmentId}`,
                );
            }
        }

        let testCode = '';
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            testCode = this.generateTestCode();
            const existing = await this.stiTestProcessRepository.findOne({
                where: { testCode },
            });
            if (!existing) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            throw new ConflictException('Không thể tạo mã xét nghiệm duy nhất');
        }

        // Tạo entity mới
        const stiTestProcess = this.stiTestProcessRepository.create({
            ...createDto,
            testCode,
            patient: { id: createDto.patientId },
            service: { id: createDto.serviceId },
            consultantDoctor: createDto.consultantDoctorId
                ? { id: createDto.consultantDoctorId }
                : undefined,
            appointment: createDto.appointmentId
                ? { id: createDto.appointmentId }
                : undefined,
            estimatedResultDate: createDto.estimatedResultDate
                ? new Date(createDto.estimatedResultDate)
                : undefined,
        });

        const saved = await this.stiTestProcessRepository.save(stiTestProcess);

        // Gửi thông báo cho bệnh nhân
        await this.sendNotificationToPatient(
            saved.id,
            'Đơn xét nghiệm STI đã được tạo thành công',
        );

        return this.findById(saved.id);
    }
    /**
     * Lấy danh sách quá trình xét nghiệm với phân trang và lọc
     */
    async findAll(
        query: QueryStiTestProcessDto,
    ): Promise<Paginated<StiTestProcessResponseDto>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = SortOrder.DESC,
            startDate,
            endDate,
            ...filters
        } = query;

        const where: FindOptionsWhere<StiTestProcess> = {};

        Object.keys(filters).forEach((key) => {
            if (filters[key] !== undefined) {
                if (key === 'testCode') {
                    where[key] = Like(`%${filters[key]}%`);
                } else {
                    where[key] = filters[key];
                }
            }
        });

        if (startDate || endDate) {
            const start = startDate
                ? new Date(startDate)
                : new Date('1900-01-01');
            const end = endDate ? new Date(endDate) : new Date('2100-12-31');
            where.createdAt = Between(start, end);
        }

        const orderOptions: { [key: string]: SortOrder } = {};
        orderOptions[sortBy] = sortOrder;

        const [data, total] = await this.stiTestProcessRepository.findAndCount({
            where,
            relations: {
                patient: true,
                service: true,
                appointment: true,
                testResult: true,
                consultantDoctor: true,
            },
            order: orderOptions,
            skip: (page - 1) * limit,
            take: limit,
        });

        const totalPages = Math.ceil(total / limit);

        const processedData = data.map((item) =>
            this.transformToResponseDto(item),
        );

        return {
            data: processedData,
            meta: {
                currentPage: page,
                totalItems: total,
                totalPages: totalPages,
                itemsPerPage: limit,
            },
        };
    }

    /**
     * Lấy thông tin chi tiết quá trình xét nghiệm
     */
    async findById(id: string): Promise<StiTestProcessResponseDto> {
        const stiTestProcess = await this.stiTestProcessRepository.findOne({
            where: { id },
            relations: {
                patient: true,
                service: true,
                appointment: true,
                testResult: true,
                consultantDoctor: true,
            },
        });

        if (!stiTestProcess) {
            throw new NotFoundException('Không tìm thấy quá trình xét nghiệm');
        }

        return this.transformToResponseDto(stiTestProcess);
    }

    /**
     * Lấy thông tin theo mã xét nghiệm
     */
    async findByTestCode(testCode: string): Promise<StiTestProcessResponseDto> {
        const stiTestProcess = await this.stiTestProcessRepository.findOne({
            where: { testCode },
            relations: {
                patient: true,
                service: true,
                appointment: true,
                testResult: true,
                consultantDoctor: true,
            },
        });

        if (!stiTestProcess) {
            throw new NotFoundException(
                'Không tìm thấy quá trình xét nghiệm với mã này',
            );
        }

        return this.transformToResponseDto(stiTestProcess);
    }

    /**
     * Cập nhật thông tin quá trình xét nghiệm
     */
    async update(
        id: string,
        updateDto: UpdateStiTestProcessDto,
    ): Promise<StiTestProcessResponseDto> {
        const stiTestProcess = await this.stiTestProcessRepository.findOne({
            where: { id },
            relations: {
                patient: true,
            },
        });

        if (!stiTestProcess) {
            throw new NotFoundException('Không tìm thấy quá trình xét nghiệm');
        }

        // Cập nhật dữ liệu
        const updateData = { ...updateDto };

        if (updateDto.estimatedResultDate) {
            updateData.estimatedResultDate = new Date(
                updateDto.estimatedResultDate,
            );
        }

        if (updateDto.actualResultDate) {
            updateData.actualResultDate = new Date(updateDto.actualResultDate);
        }

        if (updateDto.sampleCollectionDate) {
            updateData.sampleCollectionDate = new Date(
                updateDto.sampleCollectionDate,
            );
        }

        await this.stiTestProcessRepository.update(id, updateData);

        // Gửi thông báo khi trạng thái thay đổi
        if (updateDto.status && updateDto.status !== stiTestProcess.status) {
            await this.handleStatusChange(id, updateDto.status);
        }

        return this.findById(id);
    }

    /**
     * Cập nhật trạng thái quá trình xét nghiệm
     */
    async updateStatus(
        id: string,
        status: StiTestProcessStatus,
    ): Promise<StiTestProcessResponseDto> {
        return this.update(id, { status });
    }

    /**
     * Xử lý khi trạng thái thay đổi
     */
    private async handleStatusChange(
        id: string,
        newStatus: StiTestProcessStatus,
    ): Promise<void> {
        const statusMessages = {
            [StiTestProcessStatus.SAMPLE_COLLECTION_SCHEDULED]:
                'Đã lên lịch lấy mẫu xét nghiệm',
            [StiTestProcessStatus.SAMPLE_COLLECTED]:
                'Đã lấy mẫu xét nghiệm thành công',
            [StiTestProcessStatus.PROCESSING]: 'Mẫu xét nghiệm đang được xử lý',
            [StiTestProcessStatus.RESULT_READY]:
                'Kết quả xét nghiệm đã sẵn sàng',
            [StiTestProcessStatus.RESULT_DELIVERED]:
                'Đã giao kết quả xét nghiệm',
            [StiTestProcessStatus.CONSULTATION_REQUIRED]:
                'Cần tư vấn thêm về kết quả',
            [StiTestProcessStatus.COMPLETED]:
                'Quá trình xét nghiệm đã hoàn thành',
            [StiTestProcessStatus.CANCELLED]: 'Xét nghiệm đã bị hủy',
        };

        const message = statusMessages[newStatus];
        if (message) {
            await this.sendNotificationToPatient(id, message);
        }

        // Gửi email khi kết quả sẵn sàng
        if (newStatus === StiTestProcessStatus.RESULT_READY) {
            await this.sendResultNotificationEmail(id);
        }
    }

    /**
     * Gửi thông báo cho bệnh nhân
     */
    private async sendNotificationToPatient(
        processId: string,
        message: string,
    ): Promise<void> {
        try {
            const process = await this.stiTestProcessRepository.findOne({
                where: { id: processId },
                relations: {
                    patient: true,
                },
            });

            if (process && process.patient) {
                await this.notificationsService.create({
                    userId: process.patient.id,
                    title: 'Cập nhật xét nghiệm STI',
                    content: message,
                    type: 'sti_test_update',
                });
            }
        } catch (error) {
            console.error('Lỗi khi gửi thông báo:', error);
        }
    }

    /**
     * Gửi email thông báo kết quả
     */
    private async sendResultNotificationEmail(
        processId: string,
    ): Promise<void> {
        try {
            const process = await this.stiTestProcessRepository.findOne({
                where: { id: processId },
                relations: {
                    patient: true,
                    testResult: true,
                },
            });

            if (process && process.patient && !process.resultEmailSent) {
                await this.mailService.sendTestResultNotification(
                    process.patient.email,
                    {
                        userName: `${process.patient.firstName} ${process.patient.lastName}`,
                        testType: `Xét nghiệm STI - ${process.testCode}`,
                        resultDate: new Date().toLocaleDateString('vi-VN'),
                        isAbnormal: process.testResult?.isAbnormal || false,
                        recommendation: process.testResult?.recommendation,
                    },
                );

                // Cập nhật flag đã gửi email
                await this.stiTestProcessRepository.update(processId, {
                    resultEmailSent: true,
                    patientNotified: true,
                });
            }
        } catch (error) {
            console.error('Lỗi khi gửi email kết quả:', error);
        }
    }

    /**
     * Lấy danh sách quá trình xét nghiệm của bệnh nhân
     */
    async findByPatientId(
        patientId: string,
        query: QueryStiTestProcessDto,
    ): Promise<Paginated<StiTestProcessResponseDto>> {
        return this.findAll({ ...query, patientId });
    }

    /**
     * Xóa quá trình xét nghiệm
     */
    async remove(id: string): Promise<void> {
        const stiTestProcess = await this.stiTestProcessRepository.findOne({
            where: { id },
        });

        if (!stiTestProcess) {
            throw new NotFoundException('Không tìm thấy quá trình xét nghiệm');
        }

        // Chỉ cho phép xóa nếu chưa lấy mẫu
        if (
            stiTestProcess.status !== StiTestProcessStatus.ORDERED &&
            stiTestProcess.status !== StiTestProcessStatus.CANCELLED
        ) {
            throw new BadRequestException(
                'Không thể xóa quá trình xét nghiệm đã bắt đầu',
            );
        }

        await this.stiTestProcessRepository.remove(stiTestProcess);
    }

    /**
     * Chuyển đổi entity thành response DTO
     */
    private transformToResponseDto(
        entity: StiTestProcess,
    ): StiTestProcessResponseDto {
        return {
            id: entity.id,
            testCode: entity.testCode,
            status: entity.status,
            sampleType: entity.sampleType,
            priority: entity.priority,
            estimatedResultDate: entity.estimatedResultDate,
            actualResultDate: entity.actualResultDate,
            sampleCollectionDate: entity.sampleCollectionDate,
            sampleCollectionLocation: entity.sampleCollectionLocation,
            processNotes: entity.processNotes,
            labNotes: entity.labNotes,
            sampleCollectedBy: entity.sampleCollectedBy,
            labProcessedBy: entity.labProcessedBy,
            requiresConsultation: entity.requiresConsultation,
            patientNotified: entity.patientNotified,
            resultEmailSent: entity.resultEmailSent,
            isConfidential: entity.isConfidential,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            patient: entity.patient
                ? {
                      id: entity.patient.id,
                      firstName: entity.patient.firstName,
                      lastName: entity.patient.lastName,
                      email: entity.patient.email,
                      phone: entity.patient.phone,
                  }
                : undefined,
            service: entity.service
                ? {
                      id: entity.service.id,
                      name: entity.service.name,
                      description: entity.service.description,
                      price: Number(entity.service.price),
                  }
                : undefined,
            appointment: entity.appointment
                ? {
                      id: entity.appointment.id,
                      appointmentDate: entity.appointment.appointmentDate,
                      status: entity.appointment.status,
                  }
                : undefined,
            testResult: entity.testResult
                ? {
                      id: entity.testResult.id,
                      resultSummary: entity.testResult.resultSummary,
                      isAbnormal: entity.testResult.isAbnormal,
                      createdAt: entity.testResult.createdAt,
                  }
                : undefined,
            consultantDoctor: entity.consultantDoctor
                ? {
                      id: entity.consultantDoctor.id,
                      firstName: entity.consultantDoctor.firstName,
                      lastName: entity.consultantDoctor.lastName,
                      email: entity.consultantDoctor.email,
                  }
                : undefined,
        };
    }

    /**
     * Lấy tất cả processes cho thống kê dashboard
     */
    async findAllForStatistics(): Promise<StiTestProcess[]> {
        return await this.stiTestProcessRepository.find({
            relations: {
                patient: true,
                service: true,
                appointment: true,
                testResult: true,
                consultantDoctor: true,
            },
            order: { createdAt: SortOrder.DESC },
        });
    }

    /**
     * Lấy processes theo khoảng thời gian cho thống kê
     */
    async findAllForStatisticsByPeriod(
        startDate: Date,
        endDate: Date,
    ): Promise<StiTestProcess[]> {
        return await this.stiTestProcessRepository.find({
            where: {
                createdAt: Between(startDate, endDate),
            },
            relations: {
                patient: true,
                service: true,
                appointment: true,
                testResult: true,
                consultantDoctor: true,
            },
            order: { createdAt: SortOrder.DESC },
        });
    }

    /**
     * Lấy processes theo patient cho thống kê
     */
    async findAllForStatisticsByPatient(
        patientId: string,
    ): Promise<StiTestProcess[]> {
        return await this.stiTestProcessRepository.find({
            where: {
                patient: { id: patientId },
            },
            relations: {
                patient: true,
                service: true,
                appointment: true,
                testResult: true,
                consultantDoctor: true,
            },
            order: { createdAt: SortOrder.DESC },
        });
    }
}
