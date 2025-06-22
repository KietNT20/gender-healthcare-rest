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
