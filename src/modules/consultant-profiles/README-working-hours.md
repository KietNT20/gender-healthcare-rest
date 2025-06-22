# Tính năng Tự động Tạo Lịch Khả dụng cho Consultant

## Tổng quan

Tính năng này khai thác tiềm năng của trường `workingHours` trong `ConsultantProfile` để tự động tạo lịch khả dụng cho consultant trong 4 tuần tiếp theo.

## Cách hoạt động

### 1. Cấu trúc WorkingHours

```typescript
interface DayWorkingHours {
    startTime: string; // Format: "HH:mm" (e.g., "09:00")
    endTime: string; // Format: "HH:mm" (e.g., "17:00")
    isAvailable: boolean;
    maxAppointments?: number; // Số lượng appointments tối đa trong time slot
}

interface WorkingHours {
    monday?: DayWorkingHours[];
    tuesday?: DayWorkingHours[];
    wednesday?: DayWorkingHours[];
    thursday?: DayWorkingHours[];
    friday?: DayWorkingHours[];
    saturday?: DayWorkingHours[];
    sunday?: DayWorkingHours[];
    timezone?: string;
    notes?: string;
}
```

### 2. Ví dụ WorkingHours

```json
{
    "monday": [
        {
            "startTime": "09:00",
            "endTime": "12:00",
            "isAvailable": true,
            "maxAppointments": 3
        },
        {
            "startTime": "14:00",
            "endTime": "17:00",
            "isAvailable": true,
            "maxAppointments": 2
        }
    ],
    "tuesday": [
        {
            "startTime": "10:00",
            "endTime": "16:00",
            "isAvailable": true,
            "maxAppointments": 4
        }
    ],
    "wednesday": [],
    "thursday": [
        {
            "startTime": "09:00",
            "endTime": "15:00",
            "isAvailable": true,
            "maxAppointments": 3
        }
    ],
    "friday": [
        {
            "startTime": "09:00",
            "endTime": "12:00",
            "isAvailable": true,
            "maxAppointments": 2
        }
    ],
    "timezone": "Asia/Ho_Chi_Minh",
    "notes": "Lịch làm việc tiêu chuẩn"
}
```

## API Endpoints

### 1. Cập nhật WorkingHours và Tự động Tạo Lịch

```
PATCH /consultant-profiles/:id/working-hours
```

**Body:**

```json
{
    "workingHours": {
        "monday": [
            {
                "startTime": "09:00",
                "endTime": "12:00",
                "isAvailable": true,
                "maxAppointments": 3
            }
        ],
        // ... other days
        "timezone": "Asia/Ho_Chi_Minh"
    },
    "weeksToGenerate": 4
}
```

### 2. Tạo Lịch từ WorkingHours Hiện tại

```
POST /consultant-profiles/:id/generate-schedule
```

**Body:**

```json
{
    "weeksToGenerate": 4
}
```

### 3. Đảm bảo Lịch cho Các Tuần Tới

```
POST /consultant-profiles/:id/ensure-upcoming-schedule
```

## Tự động hóa

### Cron Jobs

1. **Hàng ngày lúc 2:00 AM**: Tự động đảm bảo tất cả consultant có lịch cho 4 tuần tới
2. **Chủ nhật lúc 1:00 AM**: Dọn dẹp lịch cũ (>1 tháng)

### Logic Tạo Lịch

1. **Bắt đầu từ thứ 2 tuần tiếp theo**: Tránh xung đột với lịch hiện tại
2. **Kiểm tra trùng lặp**: Không tạo lại lịch đã tồn tại
3. **Bỏ qua lịch có appointment**: Không xóa lịch đã có người đặt
4. **Tạo theo ngày cụ thể**: Mỗi availability có `specificDate` và `recurring=false`

## Lợi ích

1. **Tự động hóa**: Consultant chỉ cần thiết lập workingHours một lần
2. **Linh hoạt**: Có thể thiết lập nhiều time slot trong ngày
3. **An toàn**: Không ảnh hưởng đến lịch đã có appointment
4. **Mở rộng**: Dễ dàng thêm tính năng holiday, exception dates
5. **Hiệu quả**: Luôn có lịch sẵn sàng cho 4 tuần tới

## Workflow Thực tế

1. **Consultant đăng ký**: Thiết lập workingHours ban đầu
2. **Hệ thống tự động tạo lịch**: 4 tuần tiếp theo được tạo
3. **Hàng ngày**: Cron job kiểm tra và bổ sung lịch nếu cần
4. **Thay đổi lịch**: Consultant có thể cập nhật workingHours bất cứ lúc nào
5. **Tự động làm mới**: Lịch mới được tạo theo workingHours mới

## Xử lý Edge Cases

1. **Không có workingHours**: Báo lỗi và không tạo lịch
2. **Lịch đã tồn tại**: Bỏ qua, không tạo trùng
3. **Lịch có appointment**: Không xóa khi regenerate
4. **Thay đổi workingHours**: Xóa lịch cũ và tạo mới (trừ lịch có appointment)
5. **Consultant inactive**: Không tạo lịch mới trong cron job

## Monitoring và Logging

- Log mọi hoạt động tạo/xóa lịch
- Track số lượng lịch được tạo
- Cảnh báo khi có lỗi trong quá trình tự động
- Metrics về hiệu quả sử dụng lịch
