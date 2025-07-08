import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as PDFDocument from 'pdfkit';
import { RolesNameEnum } from 'src/enums';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { StiTestProcess } from 'src/modules/sti-test-processes/entities/sti-test-process.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { TestResult } from '../entities/test-result.entity';

@Injectable()
export class TestResultExportPdfService {
    constructor(
        @InjectRepository(TestResult)
        private readonly testResultRepository: Repository<TestResult>,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Generate PDF for test result
     */
    async generateTestResultPdf(
        id: string,
        currentUser: User,
    ): Promise<Buffer> {
        const testResult = await this.testResultRepository.findOne({
            where: { id },
            relations: {
                user: true,
                service: true,
                documents: true,
                appointment: true,
            },
        });

        if (!testResult) {
            throw new NotFoundException(`Test result with ID ${id} not found.`);
        }

        // Check permissions
        const isAdminOrStaff = [
            RolesNameEnum.ADMIN,
            RolesNameEnum.STAFF,
        ].includes(currentUser.role.name);
        if (testResult.user.id !== currentUser.id && !isAdminOrStaff) {
            throw new ForbiddenException(
                'You do not have permission to access this test result.',
            );
        }

        // Generate PDF using pdfkit
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // PDF Header
            doc.fontSize(20)
                .text('Test Result Report', 50, 50)
                .fontSize(12)
                .text(
                    'Generated on: ' + new Date().toLocaleDateString('vi-VN'),
                    50,
                    80,
                );

            // Draw a line
            doc.moveTo(50, 100).lineTo(550, 100).stroke();

            // Patient Information
            doc.fontSize(16)
                .text('Patient Information', 50, 120)
                .fontSize(12)
                .text(
                    `Name: ${testResult.user.firstName} ${testResult.user.lastName}`,
                    50,
                    150,
                )
                .text(`Email: ${testResult.user.email}`, 50, 170)
                .text(`Phone: ${testResult.user.phone || 'N/A'}`, 50, 190);

            // Service Information
            doc.fontSize(16)
                .text('Service Information', 50, 220)
                .fontSize(12)
                .text(`Service: ${testResult.service.name}`, 50, 250)
                .text(
                    `Description: ${testResult.service.description || 'N/A'}`,
                    50,
                    270,
                );

            // Test Result Information
            doc.fontSize(16)
                .text('Test Result Details', 50, 300)
                .fontSize(12)
                .text(
                    `Test Date: ${testResult.createdAt.toLocaleDateString('vi-VN')}`,
                    50,
                    330,
                )
                .text(
                    `Status: ${testResult.isAbnormal ? 'Abnormal' : 'Normal'}`,
                    50,
                    350,
                );

            // Result Summary
            if (testResult.resultSummary) {
                doc.fontSize(14)
                    .text('Result Summary:', 50, 380)
                    .fontSize(12)
                    .text(testResult.resultSummary, 50, 400, {
                        width: 500,
                        align: 'left',
                    });
            }

            // Recommendation
            if (testResult.recommendation) {
                doc.fontSize(14)
                    .text('Recommendation:', 50, 460)
                    .fontSize(12)
                    .text(testResult.recommendation, 50, 480, {
                        width: 500,
                        align: 'left',
                    });
            }

            // Footer
            doc.fontSize(10).text(
                'This document is generated electronically and is valid without signature.',
                50,
                750,
                {
                    width: 500,
                    align: 'center',
                },
            );

            doc.end();
        });
    }

    /**
     * Generate PDF for consultation report
     */
    async generateConsultationPdf(
        appointmentId: string,
        currentUser: User,
    ): Promise<Buffer> {
        const appointment = await this.dataSource
            .getRepository(Appointment)
            .findOne({
                where: { id: appointmentId },
                relations: {
                    user: true,
                    services: true,
                    testResult: true,
                },
            });

        if (!appointment) {
            throw new NotFoundException(
                `Appointment with ID ${appointmentId} not found.`,
            );
        }

        // Check permissions
        const isAdminOrStaff = [
            RolesNameEnum.ADMIN,
            RolesNameEnum.STAFF,
        ].includes(currentUser.role.name);
        if (appointment.user.id !== currentUser.id && !isAdminOrStaff) {
            throw new ForbiddenException(
                'You do not have permission to access this consultation.',
            );
        }

        // Generate PDF using pdfkit
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // PDF Header
            doc.fontSize(20)
                .text('Consultation Report', 50, 50)
                .fontSize(12)
                .text(
                    'Generated on: ' + new Date().toLocaleDateString('vi-VN'),
                    50,
                    80,
                );

            // Draw a line
            doc.moveTo(50, 100).lineTo(550, 100).stroke();

            // Patient Information
            doc.fontSize(16)
                .text('Patient Information', 50, 120)
                .fontSize(12)
                .text(
                    `Name: ${appointment.user.firstName} ${appointment.user.lastName}`,
                    50,
                    150,
                )
                .text(`Email: ${appointment.user.email}`, 50, 170)
                .text(`Phone: ${appointment.user.phone || 'N/A'}`, 50, 190);

            // Appointment Details
            doc.fontSize(16)
                .text('Appointment Details', 50, 220)
                .fontSize(12)
                .text(
                    `Date: ${appointment.appointmentDate.toLocaleDateString('vi-VN')}`,
                    50,
                    250,
                )
                .text(
                    `Time: ${appointment.appointmentDate.toLocaleTimeString('vi-VN')}`,
                    50,
                    270,
                )
                .text(`Status: ${appointment.status}`, 50, 290);

            // Services
            doc.fontSize(16).text('Services', 50, 320).fontSize(12);

            let yPosition = 350;
            appointment.services.forEach((service, index) => {
                doc.text(`${index + 1}. ${service.name}`, 50, yPosition);
                if (service.description) {
                    yPosition += 15;
                    doc.fontSize(10).text(
                        `   ${service.description}`,
                        50,
                        yPosition,
                        { width: 500 },
                    );
                    doc.fontSize(12);
                }
                yPosition += 25;
            });

            // Consultation Notes
            if (appointment.notes) {
                doc.fontSize(16)
                    .text('Consultation Notes', 50, yPosition)
                    .fontSize(12)
                    .text(appointment.notes, 50, yPosition + 30, {
                        width: 500,
                        align: 'left',
                    });
                yPosition += 100;
            }

            // Test Results (if available)
            if (appointment.testResult) {
                doc.fontSize(16)
                    .text('Test Results', 50, yPosition)
                    .fontSize(12)
                    .text(
                        `Status: ${appointment.testResult.isAbnormal ? 'Abnormal' : 'Normal'}`,
                        50,
                        yPosition + 30,
                    );

                if (appointment.testResult.resultSummary) {
                    doc.text(
                        `Summary: ${appointment.testResult.resultSummary}`,
                        50,
                        yPosition + 50,
                        {
                            width: 500,
                            align: 'left',
                        },
                    );
                }
                yPosition += 100;
            }

            // Footer
            doc.fontSize(10).text(
                'This document is generated electronically and is valid without signature.',
                50,
                750,
                {
                    width: 500,
                    align: 'center',
                },
            );

            doc.end();
        });
    }

    /**
     * Generate PDF for STI test result
     */
    async generateStiTestResultPdf(
        stiProcessId: string,
        currentUser: User,
    ): Promise<Buffer> {
        const stiProcess = await this.dataSource
            .getRepository(StiTestProcess)
            .findOne({
                where: { id: stiProcessId },
                relations: {
                    patient: true,
                    service: true,
                    testResult: true,
                    consultantDoctor: true,
                    appointment: true,
                },
            });

        if (!stiProcess) {
            throw new NotFoundException(
                `STI test process with ID ${stiProcessId} not found.`,
            );
        }

        // Check permissions
        const isAdminOrStaff = [
            RolesNameEnum.ADMIN,
            RolesNameEnum.STAFF,
        ].includes(currentUser.role.name);
        if (stiProcess.patient.id !== currentUser.id && !isAdminOrStaff) {
            throw new ForbiddenException(
                'You do not have permission to access this STI test result.',
            );
        }

        // Generate PDF using pdfkit
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // PDF Header
            doc.fontSize(20)
                .text('STI Test Result Report', 50, 50)
                .fontSize(12)
                .text(
                    'Generated on: ' + new Date().toLocaleDateString('vi-VN'),
                    50,
                    80,
                );

            // Draw a line
            doc.moveTo(50, 100).lineTo(550, 100).stroke();

            // Patient Information
            doc.fontSize(16)
                .text('Patient Information', 50, 120)
                .fontSize(12)
                .text(
                    `Name: ${stiProcess.patient.firstName} ${stiProcess.patient.lastName}`,
                    50,
                    150,
                )
                .text(`Email: ${stiProcess.patient.email}`, 50, 170)
                .text(`Phone: ${stiProcess.patient.phone || 'N/A'}`, 50, 190);

            // Test Information
            doc.fontSize(16)
                .text('Test Information', 50, 220)
                .fontSize(12)
                .text(`Test Code: ${stiProcess.testCode}`, 50, 250)
                .text(`Service: ${stiProcess.service.name}`, 50, 270)
                .text(`Sample Type: ${stiProcess.sampleType}`, 50, 290)
                .text(`Status: ${stiProcess.status}`, 50, 310)
                .text(`Priority: ${stiProcess.priority}`, 50, 330);

            // Sample Collection Details
            doc.fontSize(16)
                .text('Sample Collection Details', 50, 360)
                .fontSize(12);

            if (stiProcess.sampleCollectionDate) {
                doc.text(
                    `Collection Date: ${stiProcess.sampleCollectionDate.toLocaleDateString('vi-VN')}`,
                    50,
                    390,
                );
            }
            if (stiProcess.sampleCollectionLocation) {
                doc.text(
                    `Collection Location: ${stiProcess.sampleCollectionLocation}`,
                    50,
                    410,
                );
            }
            if (stiProcess.sampleCollectedBy) {
                doc.text(
                    `Collected By: ${stiProcess.sampleCollectedBy}`,
                    50,
                    430,
                );
            }

            // Test Result Information
            let yPosition = 460;
            if (stiProcess.testResult) {
                doc.fontSize(16)
                    .text('Test Results', 50, yPosition)
                    .fontSize(12)
                    .text(
                        `Result Status: ${stiProcess.testResult.isAbnormal ? 'Abnormal' : 'Normal'}`,
                        50,
                        yPosition + 30,
                    )
                    .text(
                        `Result Date: ${stiProcess.actualResultDate ? stiProcess.actualResultDate.toLocaleDateString('vi-VN') : 'N/A'}`,
                        50,
                        yPosition + 50,
                    );

                if (stiProcess.testResult.resultSummary) {
                    doc.fontSize(14)
                        .text('Result Summary:', 50, yPosition + 80)
                        .fontSize(12)
                        .text(
                            stiProcess.testResult.resultSummary,
                            50,
                            yPosition + 100,
                            {
                                width: 500,
                                align: 'left',
                            },
                        );
                    yPosition += 140;
                }

                if (stiProcess.testResult.recommendation) {
                    doc.fontSize(14)
                        .text('Recommendation:', 50, yPosition + 20)
                        .fontSize(12)
                        .text(
                            stiProcess.testResult.recommendation,
                            50,
                            yPosition + 40,
                            {
                                width: 500,
                                align: 'left',
                            },
                        );
                    yPosition += 80;
                }
            } else {
                doc.fontSize(16)
                    .text('Test Results', 50, yPosition)
                    .fontSize(12)
                    .text('Results are not yet available.', 50, yPosition + 30);
                yPosition += 60;
            }

            // Process Notes
            if (stiProcess.processNotes) {
                doc.fontSize(14)
                    .text('Process Notes:', 50, yPosition + 20)
                    .fontSize(12)
                    .text(stiProcess.processNotes, 50, yPosition + 40, {
                        width: 500,
                        align: 'left',
                    });
                yPosition += 80;
            }

            // Lab Notes
            if (stiProcess.labNotes) {
                doc.fontSize(14)
                    .text('Lab Notes:', 50, yPosition + 20)
                    .fontSize(12)
                    .text(stiProcess.labNotes, 50, yPosition + 40, {
                        width: 500,
                        align: 'left',
                    });
                yPosition += 80;
            }

            // Consultant Information
            if (stiProcess.consultantDoctor) {
                doc.fontSize(14)
                    .text('Consultant Doctor:', 50, yPosition + 20)
                    .fontSize(12)
                    .text(
                        `Dr. ${stiProcess.consultantDoctor.firstName} ${stiProcess.consultantDoctor.lastName}`,
                        50,
                        yPosition + 40,
                    );
                yPosition += 60;
            }

            // Footer
            doc.fontSize(10)
                .text(
                    'This document is generated electronically and is valid without signature.',
                    50,
                    750,
                    {
                        width: 500,
                        align: 'center',
                    },
                )
                .text(
                    'CONFIDENTIAL - This document contains sensitive medical information.',
                    50,
                    765,
                    {
                        width: 500,
                        align: 'center',
                    },
                );

            doc.end();
        });
    }
}
