import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Document } from 'src/modules/documents/entities/document.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { User } from 'src/modules/users/entities/user.entity';

import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

// Enum cho trạng thái của TestResult
export enum TestStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

interface TestResultData {
    [key: string]: string | number | boolean | object;
}

@Entity()
export class TestResult {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Dữ liệu chi tiết của kết quả xét nghiệm ở định dạng JSONB (ví dụ: { glucose: 120, unit: 'mg/dL' })
    // Ứng dụng: Lưu trữ kết quả xét nghiệm phức tạp (xét nghiệm máu, hình ảnh y tế) để phân tích và báo cáo
    @Column({ type: 'jsonb' })
    resultData: TestResultData;

    // Tóm tắt kết quả xét nghiệm (ví dụ: "Bình thường", "Dương tính")
    // Ứng dụng: Cung cấp thông tin ngắn gọn cho bác sĩ/bệnh nhân, dùng trong giao diện hoặc thông báo
    @Column({ type: 'text', nullable: true })
    resultSummary?: string;

    // Cờ đánh dấu kết quả có bất thường hay không
    // Ứng dụng: Cảnh báo bác sĩ ưu tiên xem xét các kết quả bất thường để xử lý hoặc theo dõi khẩn cấp
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

    // Thời điểm cập nhật bản ghi
    // Ứng dụng: Theo dõi các thay đổi để đảm bảo tính toàn vẹn dữ liệu
    @UpdateDateColumn()
    updatedAt: Date;

    // Thời điểm xóa mềm bản ghi
    // Ứng dụng: Hỗ trợ xóa mềm để giữ dữ liệu lịch sử, tuân thủ yêu cầu pháp lý
    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    // Danh sách các tài liệu đính kèm (ví dụ: ảnh X-quang, báo cáo PDF)
    // Ứng dụng: Lưu trữ tệp như ảnh (bucket công khai) và báo cáo (bucket riêng tư), thay thế fileUploads
    // Tích hợp với AwsS3Service để lưu trữ và truy cập tệp trên AWS S3
    @OneToMany(() => Document, (document) => document.testResult, {
        cascade: true,
    })
    documents: Document[];

    // Cuộc hẹn liên quan đến xét nghiệm
    // Ứng dụng: Liên kết kết quả với một cuộc hẹn cụ thể, sử dụng enum AppointmentStatusType cho trạng thái
    @OneToOne(() => Appointment, (appointment) => appointment.testResult, {
        onDelete: 'CASCADE',
    })
    appointment: Appointment;

    // Dịch vụ liên quan (ví dụ: xét nghiệm máu, X-quang)
    // Ứng dụng: Xác định loại xét nghiệm, liên kết với enum ServiceCategoryType (ví dụ: TEST)
    @ManyToOne(() => Service)
    @JoinColumn()
    service: Service;

    // Người dùng liên quan (thường là bệnh nhân)
    // Ứng dụng: Liên kết kết quả với bệnh nhân, sử dụng enum RolesNameEnum (ví dụ: CUSTOMER)
    @ManyToOne(() => User, (user) => user.testResults)
    user: User;
}
