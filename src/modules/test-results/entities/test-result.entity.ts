import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Document } from 'src/modules/documents/entities/document.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { StiTestProcess } from 'src/modules/sti-test-processes/entities/sti-test-process.entity';
import { User } from 'src/modules/users/entities/user.entity';

import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TestResultData } from '../interfaces/test-result.interfaces';

@Entity()
export class TestResult {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Dữ liệu chi tiết của kết quả xét nghiệm ở định dạng JSONB
    // Ứng dụng: Lưu trữ kết quả xét nghiệm phức tạp để phân tích và báo cáo
    @Column({ type: 'jsonb' })
    resultData: TestResultData;

    // Tóm tắt kết quả xét nghiệm (ví dụ: "Bình thường", "Dương tính")
    // Ứng dụng: Cung cấp thông tin ngắn gọn cho bác sĩ/bệnh nhân
    @Column({ type: 'text', nullable: true })
    resultSummary?: string;

    // Cờ đánh dấu kết quả có bất thường hay không
    // Ứng dụng: Cảnh báo bác sĩ ưu tiên xem xét các kết quả bất thường
    @Column({ default: false })
    isAbnormal: boolean;

    @Column({ type: 'text', nullable: true })
    recommendation?: string;

    @Column({ default: false })
    notificationSent: boolean;

    @Column({ default: false })
    followUpRequired: boolean;

    @Column({ type: 'text', nullable: true })
    followUpNotes?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @OneToMany(() => Document, (document) => document.testResult, {
        cascade: true,
    })
    documents: Document[];

    @OneToOne(() => Appointment, (appointment) => appointment.testResult)
    appointment: Appointment;

    @ManyToOne(() => Service)
    service: Service;

    @ManyToOne(() => User, (user) => user.testResults)
    user: User;

    @OneToOne(
        () => StiTestProcess,
        (stiTestProcess) => stiTestProcess.testResult,
    )
    stiTestProcess: StiTestProcess;
}
