/**
 * Giờ làm việc cho một ngày cụ thể
 */
export class DayWorkingHours {
  startTime: string; // Format: "HH:mm" (e.g., "09:00")

  endTime: string; // Format: "HH:mm" (e.g., "17:00")

  isAvailable: boolean; // Có làm việc vào ngày này không

  maxAppointments?: number; // Số lượng appointments tối đa trong ngày
}

/**
 * Lịch làm việc hàng tuần
 */
export class WorkingHours {
  monday?: DayWorkingHours[]; // Danh sách giờ làm việc cho thứ Hai

  tuesday?: DayWorkingHours[];

  wednesday?: DayWorkingHours[];

  thursday?: DayWorkingHours[];

  friday?: DayWorkingHours[];

  saturday?: DayWorkingHours[];

  sunday?: DayWorkingHours[];

  timezone?: string; // Timezone (e.g., "Asia/Ho_Chi_Minh")

  notes?: string; // Ghi chú thêm về lịch làm việc
}

/**
 * Thông tin chứng chỉ chuyên môn
 */
export class Certificate {
  name: string; // Tên chứng chỉ

  issuer: string; // Tổ chức cấp chứng chỉ

  issueDate: Date; // Ngày cấp

  expiryDate?: Date; // Ngày hết hạn (nếu có)

  certificateNumber?: string; // Số chứng chỉ

  description?: string; // Mô tả chi tiết về chứng chỉ

  imageUrl?: string; // URL hình ảnh chứng chỉ

  isVerified: boolean; // Đã được xác minh chưa

  verifiedAt?: Date; // Ngày xác minh

  verificationNotes?: string; // Ghi chú xác minh
}

/**
 * Tập hợp các chứng chỉ của tư vấn viên
 */
export class Certificates {
  items: Certificate[]; // Danh sách chứng chỉ

  lastUpdated?: Date; // Lần cập nhật cuối

  notes?: string; // Ghi chú chung về chứng chỉ
}
