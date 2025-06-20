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
import { User } from '../users/entities/user.entity';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { UpdateTestResultDto } from './dto/update-test-result.dto';
import { TestResult } from './entities/test-result.entity';

@Injectable()
export class TestResultsService {
    constructor(
        @InjectRepository(TestResult)
        private readonly testResultRepository: Repository<TestResult>,
        private readonly filesService: FilesService,
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
        private readonly dataSource: DataSource,
    ) {}

    async create(
        createDto: CreateTestResultDto,
        file: Express.Multer.File,
    ): Promise<TestResult> {
        if (!file) {
            throw new BadRequestException('Test result file is required.');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const appointment = await queryRunner.manager.findOne(Appointment, {
                where: { id: createDto.appointmentId },
                relations: ['user', 'service'],
            });

            if (!appointment) {
                throw new NotFoundException(
                    `Appointment with ID ${createDto.appointmentId} not found.`,
                );
            }

            // 1. Upload file document
            const uploadedDocument = await this.filesService.uploadDocument({
                file,
                entityType: 'test-result',
                entityId: appointment.id, // Use appointment ID for entity tracking
                description: `Test result for ${appointment.services}`,
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

            // 2. Create TestResult
            const testResult = queryRunner.manager.create(TestResult, {
                ...createDto,
                appointment,
                user: appointment.user,
                service: appointment.services[0],
                documents: [documentEntity], // Link document
            });

            const savedTestResult = await queryRunner.manager.save(
                TestResult,
                testResult,
            );

            // 3. Update the document to link it back to the testResult
            documentEntity.testResult = savedTestResult;
            await queryRunner.manager.save(Document, documentEntity);

            await queryRunner.commitTransaction();

            // 4. Send notifications (after transaction commits)
            this.sendResultNotifications(appointment.user, savedTestResult);

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
            content: `Kết quả cho dịch vụ xét nghiệm của bạn đã có. Hãy nhấn để xem chi tiết.`,
            type: 'TEST_RESULT_READY',
            actionUrl: `/results/appointment/${testResult.appointment.id}`,
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
    ): Promise<TestResult> {
        const testResult = await this.testResultRepository.findOne({
            where: { appointment: { id: appointmentId } },
            relations: ['user', 'service', 'documents'],
        });

        if (!testResult) {
            throw new NotFoundException(
                `No test result found for appointment ID ${appointmentId}.`,
            );
        }

        const isAdminOrStaff = [
            RolesNameEnum.ADMIN,
            RolesNameEnum.STAFF,
        ].includes(currentUser.role.name as RolesNameEnum);

        // Check ownership
        if (testResult.user.id !== currentUser.id && !isAdminOrStaff) {
            throw new ForbiddenException(
                'You do not have permission to view this test result.',
            );
        }

        return testResult;
    }

    // Các phương thức khác (findAll, findOne, update, remove)
    findAll() {
        return this.testResultRepository.find({
            relations: ['user', 'appointment'],
        });
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
        const result = await this.findOne(id);
        // Cần thêm logic để xóa file trên S3 nếu muốn
        return this.testResultRepository.remove(result);
    }
}
