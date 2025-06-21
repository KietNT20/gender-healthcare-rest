# Flow Đặt Lịch Tư Vấn và Tạo Phòng Chat Tự Động

## Tổng quan

Khi người dùng đặt lịch tư vấn với tư vấn viên, hệ thống sẽ tự động tạo một phòng chat (Question) gắn với lịch hẹn đó. Chỉ khách hàng và tư vấn viên được chỉ định mới có quyền truy cập vào phòng chat này.

## Flow Chi tiết

### 1. Đặt Lịch Tư Vấn

**Endpoint:** `POST /appointments`

**Request Body:**

```json
{
    "serviceIds": ["service-id-1", "service-id-2"],
    "consultantId": "consultant-id", // Optional
    "appointmentDate": "2024-01-15T10:00:00.000Z",
    "appointmentLocation": "online",
    "notes": "Ghi chú tư vấn"
}
```

**Logic xử lý:**

1. **Kiểm tra trùng lịch:** Kiểm tra xem user đã có lịch hẹn với consultant này tại thời điểm đó chưa
2. **Tạo Appointment:** Lưu thông tin lịch hẹn vào database
3. **Tạo phòng chat tự động:** Nếu là dịch vụ tư vấn (consultation), tự động tạo Question gắn với Appointment
4. **Gửi thông báo:** Gửi email và notification cho cả customer và consultant

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "appointment-id",
    "appointmentDate": "2024-01-15T10:00:00.000Z",
    "status": "pending",
    "consultant": {
      "id": "consultant-id",
      "firstName": "John",
      "lastName": "Doe"
    },
    "services": [...],
    "question": {
      "id": "question-id",
      "title": "Tư vấn với John Doe",
      "slug": "tu-van-voi-john-doe-abc12345"
    }
  }
}
```

### 2. Lấy Phòng Chat Theo Lịch Hẹn

**Endpoint:** `GET /appointments/:appointmentId/chat-room`

**Response:**

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "appointment-id",
      "appointmentDate": "2024-01-15T10:00:00.000Z",
      "status": "pending",
      "consultant": {...},
      "services": [...]
    },
    "chatRoom": {
      "id": "question-id",
      "title": "Tư vấn với John Doe",
      "content": "Phòng chat tư vấn tự động tạo khi đặt lịch.",
      "status": "pending",
      "slug": "tu-van-voi-john-doe-abc12345",
      "user": {...},
      "appointment": {...}
    }
  },
  "message": "Chat room retrieved successfully"
}
```

### 3. Truy Cập Phòng Chat

**WebSocket Event:** `JOIN_QUESTION`

**Payload:**

```json
{
    "questionId": "question-id"
}
```

**Logic phân quyền:**

- ✅ **Customer:** Chỉ có thể truy cập phòng chat của chính mình
- ✅ **Consultant:** Chỉ có thể truy cập phòng chat mà họ được chỉ định trong lịch hẹn
- ✅ **Staff/Manager/Admin:** Có thể truy cập tất cả phòng chat (cho mục đích quản lý)
- ❌ **Consultant khác:** Không có quyền truy cập

## Các Thay Đổi Đã Thực Hiện

### 1. AppointmentsService

- Thêm logic kiểm tra trùng lịch trước khi tạo appointment
- Tự động tạo phòng chat khi tạo appointment tư vấn
- Thêm method `getChatRoomByAppointmentId()`

### 2. ChatService

- Cập nhật `createQuestion()` để hỗ trợ `appointmentId` và `entityManager`
- Thêm method `getQuestionByAppointmentId()`

### 3. AppointmentsController

- Thêm endpoint `GET /appointments/:id/chat-room`

### 4. AppointmentsModule

- Import `ChatModule` để sử dụng `ChatService`

## Logic Kiểm Tra Trùng Lịch

```typescript
// Kiểm tra trùng lịch trong khoảng thời gian 1 giờ
const appointmentStart = new Date(appointmentDate);
const appointmentEnd = new Date(appointmentDate.getTime() + 60 * 60 * 1000);

const existing = await queryRunner.manager.findOne(Appointment, {
    where: {
        user: { id: currentUser.id },
        consultant: consultantId ? { id: consultantId } : undefined,
        appointmentDate: Between(appointmentStart, appointmentEnd),
        status: In([
            AppointmentStatusType.PENDING,
            AppointmentStatusType.CONFIRMED,
        ]),
    },
});
```

## Bảo Mật

1. **Phân quyền phòng chat:** Chỉ customer và consultant được chỉ định mới có quyền truy cập
2. **Kiểm tra trùng lịch:** Không cho phép đặt lịch trùng thời gian
3. **Transaction:** Sử dụng database transaction để đảm bảo tính toàn vẹn dữ liệu
4. **Validation:** Kiểm tra dữ liệu đầu vào trước khi xử lý

## Lưu Ý

1. **Thời gian lịch hẹn:** Hiện tại giả định mỗi lịch hẹn kéo dài 1 giờ, có thể điều chỉnh theo yêu cầu
2. **Tên phòng chat:** Tự động tạo tên dựa trên tên consultant
3. **Slug:** Tự động tạo slug unique cho phòng chat
4. **Status:** Phòng chat được tạo với status "pending"

## Testing

```bash
# Test tạo appointment và phòng chat
curl -X POST /appointments \
  -H "Authorization: Bearer <token>" \
  -d '{
    "serviceIds": ["consultation-service-id"],
    "consultantId": "consultant-id",
    "appointmentDate": "2024-01-15T10:00:00.000Z",
    "appointmentLocation": "online"
  }'

# Test lấy phòng chat
curl -X GET /appointments/<appointment-id>/chat-room \
  -H "Authorization: Bearer <token>"
```
