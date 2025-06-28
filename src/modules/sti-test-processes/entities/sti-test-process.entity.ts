import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { TestResult } from 'src/modules/test-results/entities/test-result.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ProcessPriority, StiSampleType, StiTestProcessStatus } from '../enums';

@Entity()
export class StiTestProcess {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Mã số xét nghiệm duy nhất
    @Column({ length: 50, unique: true })
    @Index()
    testCode: string;

    // Trạng thái hiện tại của quá trình xét nghiệm
    @Column({
        type: 'enum',
        enum: StiTestProcessStatus,
        default: StiTestProcessStatus.ORDERED,
    })
    @Index()
    status: StiTestProcessStatus;

    // Loại mẫu xét nghiệm
    @Column({
        type: 'enum',
        enum: StiSampleType,
    })
    sampleType: StiSampleType;

    // Độ ưu tiên xử lý
    @Column({
        type: 'enum',
        enum: ProcessPriority,
        default: ProcessPriority.NORMAL,
    })
    priority: ProcessPriority;

    // Thời gian dự kiến có kết quả
    @Column({ type: 'timestamp with time zone', nullable: true })
    estimatedResultDate?: Date;

    // Thời gian thực tế có kết quả
    @Column({ type: 'timestamp with time zone', nullable: true })
    actualResultDate?: Date;

    // Thời gian lấy mẫu
    @Column({ type: 'timestamp with time zone', nullable: true })
    sampleCollectionDate?: Date;

    // Địa điểm lấy mẫu
    @Column({ length: 500, nullable: true })
    sampleCollectionLocation?: string;

    // Ghi chú về quá trình
    @Column({ type: 'text', nullable: true })
    processNotes?: string;

    // Ghi chú từ lab
    @Column({ type: 'text', nullable: true })
    labNotes?: string;

    // Thông tin về người lấy mẫu
    @Column({ length: 255, nullable: true })
    sampleCollectedBy?: string;

    // Thông tin phòng lab xử lý
    @Column({ length: 255, nullable: true })
    labProcessedBy?: string;

    // Cờ đánh dấu có cần tư vấn hay không
    @Column({ default: false })
    requiresConsultation: boolean;

    // Cờ đánh dấu đã thông báo kết quả cho bệnh nhân
    @Column({ default: false })
    patientNotified: boolean;

    // Cờ đánh dấu đã gửi email kết quả
    @Column({ default: false })
    resultEmailSent: boolean;

    // Thông tin bảo mật và quyền riêng tư
    @Column({ default: true })
    isConfidential: boolean;

    // Thời gian tạo
    @CreateDateColumn()
    createdAt: Date;

    // Thời gian cập nhật
    @UpdateDateColumn()
    updatedAt: Date;

    // Quan hệ với User (bệnh nhân)
    @ManyToOne(() => User, (user) => user.stiTestProcesses)
    patient: User;

    // Quan hệ với Appointment (cuộc hẹn lấy mẫu)
    @OneToOne(() => Appointment, (appointment) => appointment.stiTestProcess)
    @JoinColumn()
    appointment?: Appointment;

    // Quan hệ với TestResult (kết quả xét nghiệm)
    @OneToOne(() => TestResult, (testResult) => testResult.stiTestProcess, {
        cascade: true,
    })
    @JoinColumn()
    testResult?: TestResult;

    // Quan hệ với Service (dịch vụ xét nghiệm)
    @ManyToOne(() => Service)
    service: Service;

    // Quan hệ với User (bác sĩ tư vấn)
    @ManyToOne(() => User, { nullable: true })
    consultantDoctor?: User;
}
