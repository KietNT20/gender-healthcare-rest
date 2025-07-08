Bạn nói đúng. Sau khi rà soát lại một cách cẩn thận toàn bộ các file mã nguồn TypeScript bạn đã cung cấp, tôi xác nhận rằng **không có đoạn code nào trực tiếp thực thi việc tính toán hay áp dụng phí phạt tài chính**.

Các phương thức như `cancel` hay `markNoShow` chỉ thay đổi trạng thái của cuộc hẹn và gửi thông báo. Logic về tài chính có thể nằm ở `PaymentsModule` nhưng vì không có mã nguồn của module đó, việc đưa chính sách phạt vào tài liệu là một sự suy đoán.

Vì vậy, tôi đã **sửa lại file `APPOINTMENT_BOOKING_FLOW.md`** để loại bỏ hoàn toàn các thông tin về phạt tiền và hoàn tiền, giúp tài liệu phản ánh chính xác 100% những gì đã được lập trình trong các file bạn đưa.

Dưới đây là phiên bản tài liệu đã được cập nhật.

---

# 📝 Hướng Dẫn Tích Hợp API Đặt Lịch & Quản Lý Cuộc Hẹn (Đã cập nhật)

Tài liệu này cung cấp hướng dẫn chi tiết cho đội ngũ Frontend về cách tích hợp và sử dụng các API của hệ thống đặt lịch và quản lý cuộc hẹn, dựa trên mã nguồn đã được cung cấp.

## 🚀 Bảng Tra Cứu Nhanh (API Quick Reference)

| Endpoint                                | Chức năng                           | Method   | Vai trò yêu cầu                              |
| :-------------------------------------- | :---------------------------------- | :------- | :------------------------------------------- |
| `POST /appointments/available-slots`    | Tìm slot tư vấn khả dụng            | `POST`   | `CUSTOMER`                                   |
| `POST /appointments`                    | Đặt lịch hẹn mới                    | `POST`   | `CUSTOMER`                                   |
| `GET /appointments`                     | Lấy danh sách cuộc hẹn (phân quyền) | `GET`    | `CUSTOMER`, `CONSULTANT`, `ADMIN`, `MANAGER` |
| `GET /appointments/:id`                 | Lấy chi tiết cuộc hẹn               | `GET`    | `CUSTOMER`, `CONSULTANT`, `ADMIN`, `MANAGER` |
| `GET /appointments/:id/chat-room`       | Lấy phòng chat của cuộc hẹn         | `GET`    | `CUSTOMER`, `CONSULTANT`, `ADMIN`, `MANAGER` |
| `PATCH /appointments/:id/status`        | Cập nhật trạng thái                 | `PATCH`  | `CONSULTANT`, `ADMIN`, `MANAGER`             |
| `PATCH /appointments/:id/cancel`        | Hủy cuộc hẹn                        | `PATCH`  | `CUSTOMER`, `ADMIN`, `MANAGER`               |
| `POST /appointments/:id/check-in`       | Check-in cho bệnh nhân              | `POST`   | `STAFF`, `ADMIN`, `MANAGER`                  |
| `POST /appointments/:id/mark-no-show`   | Đánh dấu không đến                  | `POST`   | `STAFF`, `ADMIN`, `MANAGER`                  |
| `POST /appointments/:id/late-check-in`  | Xử lý check-in trễ                  | `POST`   | `STAFF`, `ADMIN`, `MANAGER`                  |
| `PATCH /appointments/:id/meeting-link`  | Cập nhật/Thêm link họp online       | `PATCH`  | `CONSULTANT`, `ADMIN`, `MANAGER`             |
| `GET /appointments/:id/meeting-link`    | Lấy link họp online                 | `GET`    | `CUSTOMER`, `CONSULTANT`, `ADMIN`, `MANAGER` |
| `DELETE /appointments/:id/meeting-link` | Xóa link họp online                 | `DELETE` | `CONSULTANT`, `ADMIN`, `MANAGER`             |

---

## 🔐 Yêu Cầu Xác Thực (Authentication)

Tất cả các API đều yêu cầu **JWT Bearer Token** trong header `Authorization`.

**Ví dụ:**

```javascript
const headers = {
    Authorization: 'Bearer your_jwt_token_here',
    'Content-Type': 'application/json',
};
```

---

## 📖 Hướng Dẫn Chi Tiết Các API

### 1\. Booking APIs

#### 1.1. `POST /appointments/available-slots`

Tìm kiếm các slot thời gian trống cho các dịch vụ yêu cầu tư vấn viên.

- **Vai trò**: `CUSTOMER`
- **Mô tả**: Dựa vào `serviceIds` được cung cấp, API sẽ lọc ra các dịch vụ có `requiresConsultant = true` và tìm các slot trống của những tư vấn viên có chuyên môn phù hợp.

**Request Body** (`FindAvailableSlotsDto`):

```typescript
{
  "serviceIds": ["string"], // Required: Mảng ID của các dịch vụ.
  "startDate": "Date",     // Required: Ngày bắt đầu tìm kiếm (YYYY-MM-DD).
  "endDate": "Date",       // Optional: Ngày kết thúc (mặc định +7 ngày).
  "startTime": "string",   // Optional: Giờ bắt đầu trong ngày (HH:MM), mặc định '08:00'.
  "endTime": "string",     // Optional: Giờ kết thúc trong ngày (HH:MM), mặc định '18:00'.
  "consultantId": "string" // Optional: Lọc slot cho một tư vấn viên cụ thể.
}
```

**Success Response (200 OK)** (`FindAvailableSlotsResponseDto`):

```typescript
{
    "availableSlots": [
        {
            "dateTime": "Date",
            "consultant": {
                "id": "string",
                "firstName": "string",
                "lastName": "string",
                "specialties": ["string"],
                "rating": "number",
                "consultationFee": "number"
            },
            "availabilityId": "string",
            "remainingSlots": "number"
        }
    ],
    "totalSlots": "number",
    "totalConsultants": "number",
    "message": "string"
}
```

#### 1.2. `POST /appointments`

Tạo một cuộc hẹn mới.

- **Vai trò**: `CUSTOMER`
- **Logic chính**:
    - Nếu bất kỳ dịch vụ nào trong `serviceIds` có `requiresConsultant = true`, thì `consultantId` là **bắt buộc**.
    - Trạng thái ban đầu sẽ là `PENDING` nếu cần tư vấn viên và `CONFIRMED` nếu không.

**Request Body** (`CreateAppointmentDto`):

```typescript
{
  "serviceIds": ["string"],              // Optional
  "consultantId": "string",              // Optional
  "appointmentDate": "Date",             // Required
  "appointmentLocation": "LocationTypeEnum", // Required: 'ONLINE' hoặc 'OFFICE'
  "notes": "string",                     // Optional
  "meetingLink": "string"                // Optional
}
```

**Success Response (201 Created)** (Trả về `Appointment` entity).

### 2\. Management & Attendance APIs

#### 2.1. `PATCH /appointments/:id/cancel`

Hủy một cuộc hẹn.

- **Vai trò**: `CUSTOMER`, `ADMIN`, `MANAGER`
- **Logic**: Cập nhật trạng thái cuộc hẹn thành `CANCELLED` và lưu lại lý do hủy. Không thể hủy cuộc hẹn đã `COMPLETED` hoặc đã `CANCELLED`.

**Request Body** (`CancelAppointmentDto`):

```typescript
{
    "cancellationReason": "string" // Required: Lý do hủy.
}
```

**Success Response (200 OK)** (Trả về `Appointment` entity đã được cập nhật).

#### 2.2. `POST /appointments/:id/mark-no-show`

Đánh dấu một cuộc hẹn là "không đến".

- **Vai trò**: `STAFF`, `ADMIN`, `MANAGER`
- **Logic**: Cập nhật trạng thái cuộc hẹn thành `NO_SHOW` và ghi lại lý do.

**Request Body** (`MarkNoShowDto`):

```typescript
{
  "reason": "string",          // Required
  "contactAttempts": "number", // Optional
  "notes": "string"            // Optional
}
```

**Success Response (200 OK)** (`NoShowProcessResult`):

```typescript
{
    "appointmentId": "string",
    "reason": "string",
    "notificationSent": "boolean",
    "status": "string" // Trạng thái mới: 'NO_SHOW'
}
```

#### 2.3. `POST /appointments/:id/late-check-in`

Xử lý các trường hợp bệnh nhân đến trễ.

- **Vai trò**: `STAFF`, `ADMIN`, `MANAGER`
- **Logic**: Cho phép check-in nếu trễ không quá 60 phút. Nếu trễ hơn, API sẽ báo lỗi. Trạng thái cuộc hẹn được cập nhật thành `CHECKED_IN`.

**Request Body** (`LateCheckInDto`):

```typescript
{
  "actualArrivalTime": "Date",      // Required
  "adjustedServices": ["string"], // Optional
  "notes": "string"                 // Optional
}
```

**Success Response (200 OK)** (`LateCheckInResponseDto`):

```typescript
{
    "appointmentId": "string",
    "actualArrivalTime": "Date",
    "adjustedServices": ["string"],
    "estimatedWaitTime": "number",
    "status": "string", // Trạng thái mới: 'CHECKED_IN'
    "warnings": ["string"]
}
```

---

## ⚙️ Các Luồng Tự Động

- **Tự động xử lý trễ hẹn**: Một Cron Job chạy mỗi 15 phút sẽ tự động **hủy** các cuộc hẹn đã quá giờ hẹn 60 phút mà chưa check-in. Trạng thái sẽ chuyển thành `CANCELLED`.
- **Hệ thống nhắc nhở**: Cron Job chạy mỗi giờ để gửi email và thông báo nhắc nhở trước cuộc hẹn 24 giờ, 2 giờ và 30 phút.
- **Xử lý không đến**: Cron Job chạy mỗi ngày để tự động đánh dấu các cuộc hẹn không đến trong ngày hôm trước là `NO_SHOW`.
