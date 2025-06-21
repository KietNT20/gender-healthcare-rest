# Cập nhật Bảo mật Phòng Chat

## Tổng quan

Đã thực hiện cập nhật bảo mật để siết chặt quyền truy cập vào phòng chat, đảm bảo chỉ những người được phép mới có thể tham gia vào cuộc trò chuyện.

## Thay đổi chính

### 1. Logic Phân quyền Mới

**Trước đây:**

- Tất cả consultant có thể truy cập tất cả câu hỏi
- Staff, manager, admin có thể truy cập tất cả câu hỏi

**Hiện tại:**

- **Khách hàng (Customer):** Chỉ có thể truy cập câu hỏi của chính mình
- **Tư vấn viên (Consultant):** Chỉ có thể truy cập câu hỏi mà họ được chỉ định trong lịch hẹn
- **Staff/Manager/Admin:** Vẫn có thể truy cập tất cả câu hỏi (cho mục đích quản lý)
- **Các role khác:** Không có quyền truy cập

### 2. Các File Đã Cập nhật

#### `src/modules/chat/chat.service.ts`

- Cập nhật method `verifyQuestionAccess()` để kiểm tra consultant được chỉ định
- Thêm method `getUserAccessibleQuestions()` để lấy danh sách câu hỏi có quyền truy cập
- Cập nhật method `getUnreadMessageCount()` để chỉ đếm tin nhắn từ câu hỏi có quyền truy cập

#### `src/modules/chat/guards/ws-room-access.guard.ts`

- Thêm logging chi tiết cho việc truy cập
- Cung cấp thông báo lỗi rõ ràng hơn
- Thêm mã lỗi để dễ dàng xử lý ở client

#### `src/modules/chat/chat.controller.ts`

- Thêm endpoint `GET /chat/questions` để lấy danh sách câu hỏi có quyền truy cập

#### `src/modules/chat/chat.service.spec.ts`

- Thêm test cases để kiểm tra logic phân quyền mới

### 3. Cách Hoạt động

#### Kiểm tra Quyền Truy cập

```typescript
// Chỉ khách hàng và tư vấn viên được chỉ định mới có quyền truy cập
const hasAccess = await this.chatService.verifyQuestionAccess(
    questionId,
    userId,
);
```

#### Lấy Danh sách Câu hỏi Có Quyền Truy cập

```typescript
// Lấy tất cả câu hỏi mà user có quyền truy cập
const questions = await this.chatService.getUserAccessibleQuestions(userId);
```

### 4. Bảo mật WebSocket

- **WsRoomAccessGuard:** Kiểm tra quyền truy cập trước khi cho phép join room
- **WsJwtGuard:** Xác thực token trước khi kết nối WebSocket
- **RedisWsThrottleGuard:** Giới hạn tần suất gửi tin nhắn

### 5. Logging và Monitoring

- Log chi tiết khi user truy cập/thoát phòng chat
- Log cảnh báo khi có attempt truy cập trái phép
- Log lỗi khi verification thất bại

## API Endpoints

### GET /chat/questions

Lấy danh sách câu hỏi mà user hiện tại có quyền truy cập

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "question-id",
      "title": "Question Title",
      "content": "Question content",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "user": { ... },
      "appointment": {
        "consultant": { ... }
      }
    }
  ],
  "message": "Questions retrieved successfully"
}
```

## WebSocket Events

### JOIN_QUESTION

Tham gia vào phòng chat của một câu hỏi

**Payload:**

```json
{
    "questionId": "question-id"
}
```

**Response (Success):**

```json
{
    "status": "success",
    "message": "Successfully joined question",
    "questionId": "question-id",
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (Error):**

```json
{
    "status": "error",
    "message": "Access denied to this question. Only the customer and assigned consultant can access this chat room.",
    "questionId": "question-id",
    "code": "ACCESS_DENIED"
}
```

## Testing

Chạy test để đảm bảo logic phân quyền hoạt động đúng:

```bash
npm run test src/modules/chat/chat.service.spec.ts
```

## Lưu Ý

1. **Migration:** Đảm bảo database có đủ relations giữa Question và Appointment
2. **Performance:** Logic mới có thể chậm hơn do cần join nhiều bảng, cân nhắc thêm index
3. **Backward Compatibility:** Các API cũ vẫn hoạt động nhưng với logic phân quyền mới
4. **Monitoring:** Theo dõi logs để phát hiện attempt truy cập trái phép

## Tương lai

- Thêm audit log cho việc truy cập phòng chat
- Implement rate limiting cho việc join room
- Thêm notification khi có user mới join room
- Implement auto-kick user khi không còn quyền truy cập
