# Appointment Booking Flow - Comprehensive Healthcare Services

## Overview

Hệ thống đặt lịch hẹn bao quát cho các cơ sở y tế với nhiều loại dịch vụ:

- **Dịch vụ tư vấn**: Yêu cầu chọn tư vấn viên cụ thể
- **Dịch vụ xét nghiệm**: Không yêu cầu tư vấn viên
- **Dịch vụ kiểm tra sức khỏe**: Không yêu cầu tư vấn viên
- **Dịch vụ khác**: Tùy cấu hình

## Service Configuration

### New Field: `requiresConsultant`

Mỗi service có field `requiresConsultant` (boolean) để xác định:

- `true`: Dịch vụ yêu cầu chọn tư vấn viên (consultation, therapy)
- `false`: Dịch vụ không yêu cầu tư vấn viên (lab test, health checkup)

## API Endpoints

### 1. GET `/appointments/available-slots` - Tìm kiếm slot khả dụng

**Description**: Chỉ trả về slot cho các dịch vụ yêu cầu tư vấn viên

**Query Parameters**:

```typescript
{
  serviceIds: string[];           // Required: Danh sách ID dịch vụ
  startDate: string;             // Required: Ngày bắt đầu tìm kiếm (YYYY-MM-DD)
  endDate?: string;              // Optional: Ngày kết thúc (mặc định +7 ngày)
  startTime?: string;            // Optional: Giờ bắt đầu (mặc định 08:00)
  endTime?: string;              // Optional: Giờ kết thúc (mặc định 18:00)
  consultantId?: string;         // Optional: Tìm slot cho tư vấn viên cụ thể
}
```

**Response**:

```typescript
{
  availableSlots: AvailableSlotDto[];
  totalSlots: number;
  totalConsultants: number;
  message?: string;              // "Các dịch vụ được chọn không yêu cầu tư vấn viên."
}
```

### 2. POST `/appointments` - Đặt lịch hẹn (Flexible)

**Description**: Đặt cuộc hẹn linh hoạt theo loại dịch vụ

**Body**:

```typescript
{
  serviceIds: string[];                    // Required: Danh sách ID dịch vụ
  consultantId?: string;                   // Optional: ID tư vấn viên (bắt buộc cho dịch vụ tư vấn)
  appointmentDate: Date;                   // Required: Ngày giờ cuộc hẹn
  appointmentLocation: LocationTypeEnum;   // Required: Online/Office
  notes?: string;                          // Optional: Ghi chú
}
```

**Validation Logic**:

- Nếu có dịch vụ với `requiresConsultant = true` → `consultantId` bắt buộc
- Nếu tất cả dịch vụ đều `requiresConsultant = false` → `consultantId` optional

## User Flows

### Flow 1: Chỉ dịch vụ không yêu cầu tư vấn viên (Lab Test, Health Checkup)

1. Customer chọn serviceIds (lab tests, health checkup)
2. **Call API `POST /appointments`** mà không cần `consultantId`
3. Appointment được tạo với status CONFIRMED
4. Không tạo chat room

### Flow 2: Chỉ dịch vụ yêu cầu tư vấn viên (Consultation)

1. Customer chọn serviceIds (consultation services)
2. **Call API `GET /appointments/available-slots`**
3. Customer chọn slot với tư vấn viên
4. **Call API `POST /appointments`** với `consultantId`
5. Validate chuyên môn và availability
6. Appointment được tạo với status PENDING
7. Tạo chat room tự động

### Flow 3: Dịch vụ hỗn hợp (Lab Test + Consultation)

1. Customer chọn serviceIds (mixed services)
2. **Call API `GET /appointments/available-slots`**
3. Customer chọn slot với tư vấn viên cho phần consultation
4. **Call API `POST /appointments`** với `consultantId`
5. Appointment được tạo bao gồm cả hai loại dịch vụ
6. Tạo chat room cho phần consultation

### Flow 4: Optional Consultant Assignment

1. Customer chọn serviceIds (non-consultation services)
2. Có thể chọn `consultantId` nếu muốn có tư vấn viên theo dõi
3. **Call API `POST /appointments`** với hoặc không có `consultantId`
4. Không validate chuyên môn nghiêm ngặt

## Key Features

### Service Type Detection:

```typescript
// Trong Service entity
const needsConsultant = services.some((s) => s.requiresConsultant === true);

// Legacy support
const isConsultation = services.some(
    (s) => s.category.type === ServiceCategoryType.CONSULTATION,
);

// Final decision
const requiresConsultantValidation = needsConsultant || isConsultation;
```

### Enhanced Validation:

- ✅ **Flexible consultant requirement**: Dựa trên `requiresConsultant` field
- ✅ **Specialty matching**: Chỉ kiểm tra cho services yêu cầu consultant
- ✅ **Mixed service support**: Xử lý được appointment có nhiều loại service
- ✅ **Backward compatibility**: Vẫn support logic cũ qua category type

### Database Migration:

```sql
-- Thêm field mới
ALTER TABLE "service" ADD "requiresConsultant" boolean NOT NULL DEFAULT false;

-- Migrate dữ liệu cũ
UPDATE "service"
SET "requiresConsultant" = true
WHERE "categoryId" IN (
    SELECT "id" FROM "category" WHERE "type" = 'CONSULTATION'
);
```

## Example Usage

### Lab Test Only:

```typescript
const appointment = await fetch('/appointments', {
    method: 'POST',
    body: JSON.stringify({
        serviceIds: ['blood-test-uuid', 'urine-test-uuid'],
        appointmentDate: '2025-06-25T09:00:00Z',
        appointmentLocation: 'OFFICE',
        // consultantId không cần thiết
    }),
});
```

### Consultation Only:

```typescript
// 1. Tìm available slots
const slots = await fetch(
    '/appointments/available-slots?' +
        new URLSearchParams({
            serviceIds: ['nutrition-consultation-uuid'],
            startDate: '2025-06-25',
        }),
);

// 2. Đặt lịch với consultant
const appointment = await fetch('/appointments', {
    method: 'POST',
    body: JSON.stringify({
        serviceIds: ['nutrition-consultation-uuid'],
        consultantId: slots.availableSlots[0].consultant.id,
        appointmentDate: slots.availableSlots[0].dateTime,
        appointmentLocation: 'ONLINE',
    }),
});
```

### Mixed Services:

```typescript
const appointment = await fetch('/appointments', {
    method: 'POST',
    body: JSON.stringify({
        serviceIds: ['blood-test-uuid', 'nutrition-consultation-uuid'],
        consultantId: 'selected-consultant-uuid', // Required vì có consultation
        appointmentDate: '2025-06-25T10:00:00Z',
        appointmentLocation: 'OFFICE',
    }),
});
```

## Migration Notes

- ✅ **Backward compatibility**: Legacy services sẽ hoạt động như cũ
- ✅ **Flexible consultant requirement**: Không còn hardcode yêu cầu consultant
- ✅ **Better UX**: Customer biết rõ khi nào cần chọn consultant
- ✅ **Admin control**: Admin có thể config service nào yêu cầu consultant
