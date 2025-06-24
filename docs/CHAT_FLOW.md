# Chat Flow Documentation

Tài liệu này mô tả flow hoạt động của hệ thống chat trong ứng dụng Gender Healthcare REST API, bao gồm ChatController (REST API) và ChatGateway (WebSocket).

## Tổng quan kiến trúc

```
Client ←→ ChatController (REST API) ←→ ChatService ←→ Database
   ↕                                      ↕
ChatGateway (WebSocket) ←→ Redis ←→ Handlers
```

## 1. REST API Flow (ChatController)

### 1.1 Tạo câu hỏi mới

```
POST /chat/questions
```

**Flow:**

1. Client gửi request với `CreateQuestionDto`
2. Kiểm tra auth (JWT) và role (CUSTOMER)
3. `ChatService.createQuestion()` tạo question mới
4. Lưu vào database
5. Trả về thông tin question

**Quyền truy cập:** Chỉ CUSTOMER

---

### 1.2 Gửi tin nhắn text

```
POST /chat/questions/:questionId/messages
```

**Flow:**

1. Client gửi `CreateChatDto` với content
2. Kiểm tra auth và quyền truy cập question
3. `ChatService.createMessage()` tạo message
4. Lưu message vào database
5. Trả về thông tin message đã tạo

---

### 1.3 Gửi tin nhắn có file

```
POST /chat/questions/:questionId/messages/file
```

**Flow:**

1. Client upload file với `multipart/form-data`
2. Kiểm tra auth và quyền truy cập
3. `ChatService.sendMessageWithFile()`:
    - Upload file lên storage
    - Tạo message với file URL
    - Lưu vào database
4. Trả về thông tin message với file

---

### 1.4 Lấy lịch sử tin nhắn

```
GET /chat/questions/:questionId/messages
```

**Flow:**

1. Client gửi request với pagination params
2. Kiểm tra auth và quyền truy cập question
3. `ChatService.verifyQuestionAccess()` xác thực quyền
4. `ChatService.getMessageHistory()` lấy messages
5. Trả về danh sách messages với pagination

---

### 1.5 Đánh dấu đã đọc

```
PATCH /messages/:messageId/read
PATCH /questions/:questionId/messages/read-all
```

**Flow đánh dấu 1 message:**

1. `ChatService.markMessageAsRead()` cập nhật trạng thái
2. Cập nhật database

**Flow đánh dấu tất cả:**

1. `ChatService.markAllMessagesAsRead()` cập nhật hàng loạt
2. Cập nhật database cho tất cả messages chưa đọc

---

### 1.6 Xóa tin nhắn

```
DELETE /messages/:messageId
```

**Flow:**

1. Kiểm tra quyền xóa message
2. `ChatService.deleteMessage()` soft delete
3. Cập nhật trạng thái deleted trong database

---

### 1.7 Các endpoint khác

**Lấy tóm tắt question:**

```
GET /chat/questions/:questionId/summary
```

**Đếm tin nhắn chưa đọc:**

```
GET /chat/messages/unread-count
```

**Download file:**

```
GET /chat/messages/:messageId/file
```

**Lấy danh sách questions:**

```
GET /chat/questions
```

## 2. WebSocket Flow (ChatGateway)

### 2.1 Kết nối WebSocket

**Namespace:** `/chat`

**Flow kết nối:**

1. Client kết nối với JWT token
2. `WsJwtGuard` xác thực token
3. `ConnectionHandler.handleConnection()`:
    - Lưu thông tin user vào Redis
    - Cập nhật presence status
    - Emit event `connected`

**Flow ngắt kết nối:**

1. `ConnectionHandler.handleDisconnect()`:
    - Cleanup Redis data
    - Remove user từ các rooms
    - Cập nhật presence status

---

### 2.2 Tham gia room câu hỏi

**Event:** `join_question`

**Flow:**

1. Client emit với `questionId`
2. `WsRoomAccessGuard` kiểm tra quyền truy cập
3. `RedisWsThrottleGuard` kiểm tra rate limiting
4. `RoomHandler.handleJoinQuestion()`:
    - Join Socket.io room
    - Lưu vào Redis
    - Thông báo cho các users khác
    - Emit `user_joined` đến room

**Response:**

```json
{
    "status": "success",
    "message": "Successfully joined question",
    "questionId": "uuid",
    "timestamp": "2025-06-24T..."
}
```

---

### 2.3 Rời room câu hỏi

**Event:** `leave_question`

**Flow:**

1. Client emit với `questionId`
2. `RoomHandler.handleLeaveQuestion()`:
    - Leave Socket.io room
    - Remove từ Redis
    - Emit `user_left` đến room

---

### 2.4 Gửi tin nhắn realtime

**Event:** `send_message`

**Flow:**

1. Client emit với message data
2. Guards kiểm tra quyền và rate limiting
3. `MessageHandler.handleSendMessage()`:
    - Validate data
    - Lưu message vào database
    - Emit `new_message` đến tất cả users trong room
    - Cập nhật unread count

**Message format:**

```json
{
    "questionId": "uuid",
    "content": "Hello world",
    "type": "TEXT"
}
```

---

### 2.5 Typing indicator

**Event:** `typing`

**Flow:**

1. Client emit trạng thái typing
2. `TypingHandler.handleTyping()`:
    - Lưu trạng thái vào Redis với TTL
    - Emit `typing_status` đến users khác trong room
    - Auto cleanup sau TTL

**Data format:**

```json
{
    "questionId": "uuid",
    "isTyping": true
}
```

---

### 2.6 Đánh dấu đã đọc realtime

**Event:** `mark_as_read`

**Flow:**

1. Client emit với `messageId` và `questionId`
2. `MessageHandler.handleMarkAsRead()`:
    - Cập nhật database
    - Emit `message_read` đến sender
    - Cập nhật unread count

---

### 2.7 Server-to-client events

**Các events mà server emit:**

1. **`connected`** - Khi client kết nối thành công
2. **`joined_question`** - Khi join room thành công
3. **`user_joined`** - Khi có user mới join room
4. **`user_left`** - Khi có user rời room
5. **`new_message`** - Khi có tin nhắn mới
6. **`message_read`** - Khi tin nhắn được đọc
7. **`typing_status`** - Trạng thái typing của users
8. **`question_updated`** - Khi question được cập nhật
9. **`consultant_assigned`** - Khi được assign consultant

## 3. Redis Integration

### 3.1 Redis Keys Pattern

```
chat:user:presence:{userId}     - User online status
chat:question:users:{questionId} - Users trong question room
chat:question:typing:{questionId} - Users đang typing
chat:user:rooms:{userId}        - Rooms mà user đã join
```

### 3.2 TTL Values

- User presence: 5 minutes
- Question users: 1 hour
- Typing status: 10 seconds
- Individual typing: 5 seconds

## 4. Guards và Middleware

### 4.1 WsJwtGuard

- Xác thực JWT token cho WebSocket
- Extract user info từ token

### 4.2 WsRoomAccessGuard

- Kiểm tra quyền truy cập vào question room
- Verify user có thể join room hay không

### 4.3 RedisWsThrottleGuard

- Rate limiting cho WebSocket events
- Prevent spam và abuse

### 4.4 RoleGuard (REST API)

- Kiểm tra role permissions
- Restrict access theo roles

## 5. Error Handling

### 5.1 REST API Errors

- HTTP status codes chuẩn
- Error messages localized (tiếng Việt)
- Structured error responses

### 5.2 WebSocket Errors

- Error acknowledgements cho events
- Graceful error handling
- Log errors để debug

## 6. Security Features

### 6.1 Authentication

- JWT tokens cho cả REST và WebSocket
- Token validation và refresh

### 6.2 Authorization

- Role-based access control
- Question-level access control
- File access permissions

### 6.3 Rate Limiting

- Redis-based throttling
- Per-user rate limits
- Different limits cho different events

## 7. Performance Optimizations

### 7.1 Redis Caching

- Cache user presence
- Cache room memberships
- TTL-based cleanup

### 7.2 Database Optimization

- Pagination cho message history
- Efficient queries với indexes
- Soft deletes

### 7.3 File Handling

- File upload optimization
- Secure file storage
- File access control

## 8. Monitoring và Logging

### 8.1 Logs

- Connection/disconnection events
- Error logs với stack traces
- Performance metrics

### 8.2 Health Checks

- Redis health monitoring
- Database connection status
- WebSocket server status

## 9. Deployment Considerations

### 9.1 Scaling

- Horizontal scaling với Redis
- Load balancer sticky sessions
- Database connection pooling

### 9.2 Environment Configuration

- Production vs Development configs
- SSL/TLS cho production
- Environment-specific Redis settings
