import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesNameEnum } from 'src/enums';
import { DataSource, Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Document } from '../documents/entities/document.entity';
import { FilesService } from '../files/files.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { TestResultResponseDto } from './dto/test-result-response.dto';
import { UpdateTestResultDto } from './dto/update-test-result.dto';
import { TestResult } from './entities/test-result.entity';
import { TestResultMapperService } from './services/test-result-mapper.service';

@Injectable()
export class TestResultsService {
    constructor(
        @InjectRepository(TestResult)
        private readonly testResultRepository: Repository<TestResult>,
        private readonly filesService: FilesService,
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
        private readonly dataSource: DataSource,
        private readonly testResultMapperService: TestResultMapperService,
    ) {}

    async create(
        createDto: CreateTestResultDto,
        file: Express.Multer.File,
    ): Promise<TestResult> {
        if (!file) {
            throw new BadRequestException('Test result file is required.');
        }

        // Validate input: phải có appointmentId hoặc (patientId + serviceId)
        if (
            !createDto.appointmentId &&
            (!createDto.patientId || !createDto.serviceId)
        ) {
            throw new BadRequestException(
                'Either appointmentId or both patientId and serviceId are required.',
            );
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let appointment: Appointment | null = null;
            let user: User;
            let service: Service;

            if (createDto.appointmentId) {
                // Case 1: Online consultation - có appointment (tư vấn trực tuyến)
                const foundAppointment = await queryRunner.manager.findOne(
                    Appointment,
                    {
                        where: { id: createDto.appointmentId },
                        relations: {
                            user: true,
                            services: true,
                        },
                    },
                );

                if (!foundAppointment) {
                    throw new NotFoundException(
                        `Appointment with ID ${createDto.appointmentId} not found.`,
                    );
                }

                appointment = foundAppointment;
                user = appointment.user;
                service = appointment.services[0];
            } else {
                // Case 2: Medical service - chỉ cần serviceId + patientId (xét nghiệm, khám sức khỏe, v.v.)
                const patient = await queryRunner.manager.findOne(User, {
                    where: { id: createDto.patientId },
                });

                if (!patient) {
                    throw new NotFoundException(
                        `Patient with ID ${createDto.patientId} not found.`,
                    );
                }

                const selectedService = await queryRunner.manager.findOne(
                    Service,
                    {
                        where: { id: createDto.serviceId },
                    },
                );

                if (!selectedService) {
                    throw new NotFoundException(
                        `Service with ID ${createDto.serviceId} not found.`,
                    );
                }

                user = patient;
                service = selectedService;
                // Không tạo appointment cho medical services
            }

            // 1. Upload file document
            const uploadedDocument = await this.filesService.uploadDocument({
                file,
                entityType: 'test-result',
                entityId: appointment?.id || user.id, // Dùng appointment.id nếu có, không thì dùng user.id
                description: `Test result for ${service.name}`,
                isSensitive: true,
            });

            const documentEntity = await queryRunner.manager.findOneBy(
                Document,
                { id: uploadedDocument.id },
            );
            if (!documentEntity) {
                throw new NotFoundException(
                    `Document with ID ${uploadedDocument.id} not found after upload.`,
                );
            }

            // 2. Calculate summary fields từ resultData đã validated
            const summaryFields =
                this.testResultMapperService.calculateSummaryFields(
                    createDto.resultData,
                );

            // 3. Create TestResult với data đã validated từ DTO
            const testResult = queryRunner.manager.create(TestResult, {
                ...createDto,
                resultData: createDto.resultData, // DTO đã được validate sẵn
                ...summaryFields, // Auto-calculate isAbnormal, resultSummary, followUpRequired
                ...(appointment && { appointment }), // Chỉ set appointment nếu có
                user,
                service,
                documents: [documentEntity], // Link document
            });

            const savedTestResult = await queryRunner.manager.save(
                TestResult,
                testResult,
            );

            // 4. Update the document to link it back to the testResult
            documentEntity.testResult = savedTestResult;
            await queryRunner.manager.save(Document, documentEntity);

            await queryRunner.commitTransaction();

            // 5. Send notifications (after transaction commits)
            this.sendResultNotifications(user, savedTestResult);

            return savedTestResult;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async sendResultNotifications(user: User, testResult: TestResult) {
        const userName = `${user.firstName} ${user.lastName}`;
        const resultDate = new Date(testResult.createdAt).toLocaleDateString(
            'vi-VN',
        );

        // In-app notification
        this.notificationsService.create({
            userId: user.id,
            title: 'Kết quả xét nghiệm của bạn đã có',
            content: `Kết quả cho dịch vụ ${testResult.service.name} của bạn đã có. Hãy nhấn để xem chi tiết.`,
            type: 'TEST_RESULT_READY',
            actionUrl: testResult.appointment
                ? `/results/appointment/${testResult.appointment.id}`
                : `/results/${testResult.id}`,
        });

        // Email notification
        this.mailService.sendTestResultNotification(user.email, {
            userName,
            testType: testResult.service.name,
            resultDate,
            isAbnormal: testResult.isAbnormal,
            recommendation: testResult.recommendation,
        });
    }

    async findByAppointmentId(
        appointmentId: string,
        currentUser: User,
    ): Promise<TestResultResponseDto> {
        const testResult = await this.testResultRepository.findOne({
            where: { appointment: { id: appointmentId } },
            relations: {
                user: true,
                service: true,
                documents: true,
            },
        });

        if (!testResult) {
            throw new NotFoundException(
                `No test result found for appointment ID ${appointmentId}.`,
            );
        }

        const isAdminOrStaff = [
            RolesNameEnum.ADMIN,
            RolesNameEnum.STAFF,
        ].includes(currentUser.role.name);

        // Check ownership
        if (testResult.user.id !== currentUser.id && !isAdminOrStaff) {
            throw new ForbiddenException(
                'You do not have permission to view this test result.',
            );
        }

        // Return normalized response DTO
        return this.testResultMapperService.toResponseDto(testResult);
    }

    findAll() {
        const testResults = this.testResultRepository.find({
            relations: {
                user: true,
                appointment: true,
                service: true,
                documents: true,
            },
        });

        return testResults.then((results) =>
            this.testResultMapperService.toResponseDtos(results),
        );
    }

    async findOne(id: string) {
        const result = await this.testResultRepository.findOneBy({ id });
        if (!result) {
            throw new NotFoundException(`Test result with ID ${id} not found.`);
        }
        return result;
    }

    async update(id: string, updateDto: UpdateTestResultDto) {
        const result = await this.testResultRepository.preload({
            id: id,
            ...updateDto,
        });

        if (!result) {
            throw new NotFoundException(`Test result with ID ${id} not found.`);
        }

        return this.testResultRepository.save(result);
    }

    async remove(id: string) {
        const result = await this.testResultRepository.findOne({
            where: { id },
            relations: {
                documents: true,
            },
        });

        if (!result) {
            throw new NotFoundException(`Test result with ID ${id} not found.`);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Delete associated documents from S3 and database
            if (result.documents && result.documents.length > 0) {
                for (const document of result.documents) {
                    try {
                        // Delete file from S3
                        await this.filesService
                            .getAwsS3Service()
                            .deleteFile(document.path);
                        console.log(
                            `Deleted document file from S3: ${document.path}`,
                        );
                    } catch (error) {
                        console.error(
                            `Failed to delete file from S3: ${document.path}`,
                            error,
                        );
                        // Continue with database deletion even if S3 deletion fails
                    }

                    // Delete document from database
                    await queryRunner.manager.remove(Document, document);
                }
            }

            // 2. Delete test result from database
            await queryRunner.manager.remove(TestResult, result);

            await queryRunner.commitTransaction();

            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Gửi thông báo kết quả xét nghiệm cho bệnh nhân
     */
    async sendNotificationToPatient(
        id: string,
    ): Promise<{ success: boolean; message: string }> {
        const testResult = await this.testResultRepository.findOne({
            where: { id },
            relations: {
                user: true,
                appointment: true,
                service: true,
            },
        });

        if (!testResult) {
            throw new NotFoundException(`Test result with ID ${id} not found.`);
        }

        if (testResult.notificationSent) {
            return {
                success: false,
                message: 'Thông báo đã được gửi trước đó',
            };
        }

        try {
            await this.sendResultNotifications(testResult.user, testResult);

            // Cập nhật flag đã gửi thông báo
            await this.testResultRepository.update(id, {
                notificationSent: true,
            });

            return {
                success: true,
                message: 'Thông báo đã được gửi thành công',
            };
        } catch (error) {
            throw new BadRequestException(
                `Lỗi khi gửi thông báo: ${error.message}`,
            );
        }
    }

    /**
     * Gửi thông báo kết quả theo appointment ID
     */
    async sendNotificationByAppointmentId(
        appointmentId: string,
    ): Promise<{ success: boolean; message: string }> {
        const testResult = await this.testResultRepository.findOne({
            where: { appointment: { id: appointmentId } },
            relations: {
                user: true,
                appointment: true,
                service: true,
            },
        });

        if (!testResult) {
            throw new NotFoundException(
                `No test result found for appointment ID ${appointmentId}.`,
            );
        }

        return this.sendNotificationToPatient(testResult.id);
    }

    /**
     * Lấy tất cả kết quả xét nghiệm của bệnh nhân
     */
    async findByPatientId(patientId: string): Promise<TestResultResponseDto[]> {
        const testResults = await this.testResultRepository.find({
            where: { user: { id: patientId } },
            relations: {
                appointment: true,
                service: true,
                documents: true,
            },
            order: { createdAt: 'DESC' },
        });

        return this.testResultMapperService.toResponseDtos(testResults);
    }

    /**
     * Lấy chi tiết kết quả xét nghiệm của bệnh nhân
     */
    async findOneByPatient(
        id: string,
        patientId: string,
    ): Promise<TestResultResponseDto> {
        const testResult = await this.testResultRepository.findOne({
            where: {
                id,
                user: { id: patientId },
            },
            relations: {
                user: true,
                appointment: true,
                service: true,
                documents: true,
            },
        });

        if (!testResult) {
            throw new NotFoundException(
                `Test result with ID ${id} not found or not accessible.`,
            );
        }

        return this.testResultMapperService.toResponseDto(testResult);
    }
}
