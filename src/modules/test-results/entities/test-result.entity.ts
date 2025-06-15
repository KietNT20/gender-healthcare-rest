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
  // Định danh duy nhất cho kết quả xét nghiệm
  // Ứng dụng: Được sử dụng để nhận diện duy nhất mỗi bản ghi kết quả xét nghiệm trong hệ thống
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

  // Khuyến nghị của bác sĩ dựa trên kết quả (ví dụ: "Tái xét nghiệm sau 1 tháng")
  // Ứng dụng: Hướng dẫn chăm sóc bệnh nhân, được cập nhật trong giai đoạn tư vấn
  @Column({ type: 'text', nullable: true })
  recommendation?: string;

  // Thời điểm kết quả được xem bởi bệnh nhân hoặc bác sĩ
  // Ứng dụng: Theo dõi hành vi người dùng, dùng để kiểm tra hoặc nhắc nhở theo dõi
  @Column({ type: 'timestamp with time zone', nullable: true })
  viewedAt?: Date;

  // Cờ đánh dấu liệu thông báo đã được gửi cho bệnh nhân/bác sĩ
  // Ứng dụng: Đảm bảo người dùng được thông báo về kết quả, ngăn gửi thông báo trùng lặp
  @Column({ default: false })
  notificationSent: boolean;

  // Ngày thực hiện xét nghiệm
  // Ứng dụng: Theo dõi thời điểm xét nghiệm được tiến hành, dùng để báo cáo theo thời gian
  @Column({ type: 'timestamp with time zone' })
  testDate: Date;

  // Ngày hoàn thành kết quả xét nghiệm
  // Ứng dụng: Đánh dấu thời điểm phòng thí nghiệm hoàn tất phân tích, dùng để theo dõi thời gian xử lý
  @Column({ type: 'timestamp with time zone', nullable: true })
  resultDate?: Date;

  // Trạng thái của kết quả xét nghiệm, được định nghĩa trong enum TestStatus
  // Ứng dụng: Quản lý vòng đời kết quả xét nghiệm (ví dụ: đang chờ xử lý, hoàn thành, hủy)
  @Column({ type: 'enum', enum: TestStatus, default: TestStatus.PENDING })
  status: TestStatus;

  // Thời điểm tạo bản ghi
  // Ứng dụng: Dùng để theo dõi lịch sử tạo và kiểm tra dữ liệu
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
  @OneToMany(() => Document, (document) => document.testResult, { cascade: true })
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
