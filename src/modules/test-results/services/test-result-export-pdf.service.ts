import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
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
     * Register Vietnamese font for PDF
     */
    private registerVietnameseFont(doc: typeof PDFDocument): void {
        try {
            const fontPath = path.join(
                __dirname,
                '../../../assets/fonts/Montserrat-VariableFont_wght.ttf',
            );
            if (fs.existsSync(fontPath)) {
                doc.font(fontPath);
                return;
            }
        } catch (error) {
            console.warn('Could not load custom font, using fallback', error);
        }

        // Fallback to system fonts
        doc.font('Times New Roman');
    }

    /**
     * Format Vietnamese date
     */
    private formatVietnameseDate(date: Date): string {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Format Vietnamese time
     */
    private formatVietnameseTime(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

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

            // Register Vietnamese font
            this.registerVietnameseFont(doc);

            doc.on('data', (chunk: Buffer) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // PDF Header
            doc.fontSize(20)
                .text('BÁO CÁO KẾT QUẢ XÉT NGHIỆM', 50, 50)
                .fontSize(12)
                .text(
                    'Ngày tạo: ' + this.formatVietnameseDate(new Date()),
                    50,
                    80,
                );

            // Draw a line
            doc.moveTo(50, 100).lineTo(550, 100).stroke();

            // Patient Information
            doc.fontSize(16)
                .text('THÔNG TIN BỆNH NHÂN', 50, 120)
                .fontSize(12)
                .text(
                    `Họ và tên: ${testResult.user.firstName} ${testResult.user.lastName}`,
                    50,
                    150,
                )
                .text(`Email: ${testResult.user.email}`, 50, 170)
                .text(
                    `Số điện thoại: ${testResult.user.phone || 'Không có'}`,
                    50,
                    190,
                );

            // Service Information
            doc.fontSize(16)
                .text('THÔNG TIN DỊCH VỤ', 50, 220)
                .fontSize(12)
                .text(`Dịch vụ: ${testResult.service.name}`, 50, 250)
                .text(
                    `Mô tả: ${testResult.service.description || 'Không có'}`,
                    50,
                    270,
                );

            // Test Result Information
            doc.fontSize(16)
                .text('CHI TIẾT KẾT QUẢ XÉT NGHIỆM', 50, 300)
                .fontSize(12)
                .text(
                    `Ngày xét nghiệm: ${this.formatVietnameseDate(testResult.createdAt)}`,
                    50,
                    330,
                )
                .text(
                    `Tình trạng: ${testResult.isAbnormal ? 'Bất thường' : 'Bình thường'}`,
                    50,
                    350,
                );

            // Result Summary
            if (testResult.resultSummary) {
                doc.fontSize(14)
                    .text('Tóm tắt kết quả:', 50, 380)
                    .fontSize(12)
                    .text(testResult.resultSummary, 50, 400, {
                        width: 500,
                        align: 'left',
                    });
            }

            // Recommendation
            if (testResult.recommendation) {
                doc.fontSize(14)
                    .text('Khuyến nghị:', 50, 460)
                    .fontSize(12)
                    .text(testResult.recommendation, 50, 480, {
                        width: 500,
                        align: 'left',
                    });
            }

            // Footer
            doc.fontSize(10).text(
                'Tài liệu này được tạo tự động bằng hệ thống điện tử và có giá trị mà không cần chữ ký.',
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

            // Register Vietnamese font
            this.registerVietnameseFont(doc);

            doc.on('data', (chunk: Buffer) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // PDF Header
            doc.fontSize(20)
                .text('BÁO CÁO TƯ VẤN KHÁM BỆNH', 50, 50)
                .fontSize(12)
                .text(
                    'Ngày tạo: ' + this.formatVietnameseDate(new Date()),
                    50,
                    80,
                );

            // Draw a line
            doc.moveTo(50, 100).lineTo(550, 100).stroke();

            // Patient Information
            doc.fontSize(16)
                .text('THÔNG TIN BỆNH NHÂN', 50, 120)
                .fontSize(12)
                .text(
                    `Họ và tên: ${appointment.user.firstName} ${appointment.user.lastName}`,
                    50,
                    150,
                )
                .text(`Email: ${appointment.user.email}`, 50, 170)
                .text(
                    `Số điện thoại: ${appointment.user.phone || 'Không có'}`,
                    50,
                    190,
                );

            // Appointment Details
            doc.fontSize(16)
                .text('THÔNG TIN LỊCH HẸN', 50, 220)
                .fontSize(12)
                .text(
                    `Ngày: ${this.formatVietnameseDate(appointment.appointmentDate)}`,
                    50,
                    250,
                )
                .text(
                    `Thời gian: ${this.formatVietnameseTime(appointment.appointmentDate)}`,
                    50,
                    270,
                )
                .text(`Trạng thái: ${appointment.status}`, 50, 290);

            // Services
            doc.fontSize(16).text('DỊCH VỤ', 50, 320).fontSize(12);

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
                    .text('GHI CHÚ TƯ VẤN', 50, yPosition)
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
                    .text('KẾT QUẢ XÉT NGHIỆM', 50, yPosition)
                    .fontSize(12)
                    .text(
                        `Tình trạng: ${appointment.testResult.isAbnormal ? 'Bất thường' : 'Bình thường'}`,
                        50,
                        yPosition + 30,
                    );

                if (appointment.testResult.resultSummary) {
                    doc.text(
                        `Tóm tắt: ${appointment.testResult.resultSummary}`,
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
                'Tài liệu này được tạo tự động bằng hệ thống điện tử và có giá trị mà không cần chữ ký.',
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

            // Register Vietnamese font
            this.registerVietnameseFont(doc);

            doc.on('data', (chunk: Buffer) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // PDF Header
            doc.fontSize(20)
                .text('BÁO CÁO KẾT QUẢ XÉT NGHIỆM STI', 50, 50)
                .fontSize(12)
                .text(
                    'Ngày tạo: ' + this.formatVietnameseDate(new Date()),
                    50,
                    80,
                );

            // Draw a line
            doc.moveTo(50, 100).lineTo(550, 100).stroke();

            // Patient Information
            doc.fontSize(16)
                .text('THÔNG TIN BỆNH NHÂN', 50, 120)
                .fontSize(12)
                .text(
                    `Họ và tên: ${stiProcess.patient.firstName} ${stiProcess.patient.lastName}`,
                    50,
                    150,
                )
                .text(`Email: ${stiProcess.patient.email}`, 50, 170)
                .text(
                    `Số điện thoại: ${stiProcess.patient.phone || 'Không có'}`,
                    50,
                    190,
                );

            // Test Information
            doc.fontSize(16)
                .text('THÔNG TIN XÉT NGHIỆM', 50, 220)
                .fontSize(12)
                .text(`Mã xét nghiệm: ${stiProcess.testCode}`, 50, 250)
                .text(`Dịch vụ: ${stiProcess.service.name}`, 50, 270)
                .text(`Loại mẫu: ${stiProcess.sampleType}`, 50, 290)
                .text(`Trạng thái: ${stiProcess.status}`, 50, 310)
                .text(`Mức độ ưu tiên: ${stiProcess.priority}`, 50, 330);

            // Sample Collection Details
            doc.fontSize(16).text('CHI TIẾT LẤY MẪU', 50, 360).fontSize(12);

            if (stiProcess.sampleCollectionDate) {
                doc.text(
                    `Ngày lấy mẫu: ${this.formatVietnameseDate(stiProcess.sampleCollectionDate)}`,
                    50,
                    390,
                );
            }
            if (stiProcess.sampleCollectionLocation) {
                doc.text(
                    `Địa điểm lấy mẫu: ${stiProcess.sampleCollectionLocation}`,
                    50,
                    410,
                );
            }
            if (stiProcess.sampleCollectedBy) {
                doc.text(
                    `Người lấy mẫu: ${stiProcess.sampleCollectedBy}`,
                    50,
                    430,
                );
            }

            // Test Result Information
            let yPosition = 460;
            if (stiProcess.testResult) {
                doc.fontSize(16)
                    .text('KẾT QUẢ XÉT NGHIỆM', 50, yPosition)
                    .fontSize(12)
                    .text(
                        `Tình trạng kết quả: ${stiProcess.testResult.isAbnormal ? 'Bất thường' : 'Bình thường'}`,
                        50,
                        yPosition + 30,
                    )
                    .text(
                        `Ngày có kết quả: ${stiProcess.actualResultDate ? this.formatVietnameseDate(stiProcess.actualResultDate) : 'Chưa có'}`,
                        50,
                        yPosition + 50,
                    );

                if (stiProcess.testResult.resultSummary) {
                    doc.fontSize(14)
                        .text('Tóm tắt kết quả:', 50, yPosition + 80)
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
                        .text('Khuyến nghị:', 50, yPosition + 20)
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
                    .text('KẾT QUẢ XÉT NGHIỆM', 50, yPosition)
                    .fontSize(12)
                    .text('Kết quả chưa sẵn sàng.', 50, yPosition + 30);
                yPosition += 60;
            }

            // Process Notes
            if (stiProcess.processNotes) {
                doc.fontSize(14)
                    .text('Ghi chú quá trình:', 50, yPosition + 20)
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
                    .text('Ghi chú phòng thí nghiệm:', 50, yPosition + 20)
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
                    .text('Bác sĩ tư vấn:', 50, yPosition + 20)
                    .fontSize(12)
                    .text(
                        `BS. ${stiProcess.consultantDoctor.firstName} ${stiProcess.consultantDoctor.lastName}`,
                        50,
                        yPosition + 40,
                    );
                yPosition += 60;
            }

            // Footer
            doc.fontSize(10)
                .text(
                    'Tài liệu này được tạo tự động bằng hệ thống điện tử và có giá trị mà không cần chữ ký.',
                    50,
                    750,
                    {
                        width: 500,
                        align: 'center',
                    },
                )
                .text(
                    'BẢO MẬT - Tài liệu này chứa thông tin y tế nhạy cảm.',
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
