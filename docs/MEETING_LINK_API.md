# Meeting Link API Documentation

## Tổng quan

API này cho phép consultant và admin quản lý meeting link cho các cuộc hẹn. Consultant có thể:

- Xem danh sách cuộc hẹn của mình
- Cập nhật meeting link cho cuộc hẹn
- Xóa meeting link
- Xem meeting link của cuộc hẹn

## Endpoints

### 1. Lấy danh sách cuộc hẹn của consultant

**GET** `/appointments/consultant/my-appointments`

**Quyền:** CONSULTANT

**Query Parameters:**

- `status` (optional): Lọc theo trạng thái cuộc hẹn
    - `pending`: Chờ xác nhận
    - `confirmed`: Đã xác nhận
    - `completed`: Hoàn thành
    - `cancelled`: Đã hủy
- `dateFrom` (optional): Ngày bắt đầu (format: YYYY-MM-DD)
- `dateTo` (optional): Ngày kết thúc (format: YYYY-MM-DD)

### 2. Cập nhật meeting link

**PATCH** `/appointments/{appointmentId}/meeting-link`

**Quyền:** CONSULTANT, ADMIN, MANAGER

### 3. Lấy meeting link

**GET** `/appointments/{appointmentId}/meeting-link`

**Quyền:** Tất cả người dùng liên quan (customer, consultant, admin, manager)


### 4. Xóa meeting link

**DELETE** `/appointments/{appointmentId}/meeting-link`

**Quyền:** CONSULTANT, ADMIN, MANAGER

## Quyền truy cập

### Consultant

- Có thể xem danh sách cuộc hẹn của mình
- Có thể cập nhật/xóa meeting link cho cuộc hẹn được gán
- Có thể xem meeting link của cuộc hẹn được gán

### Admin/Manager

- Có thể cập nhật/xóa meeting link cho bất kỳ cuộc hẹn nào
- Có thể xem meeting link của bất kỳ cuộc hẹn nào

### Customer

- Có thể xem meeting link của cuộc hẹn của mình

## Thông báo

Khi meeting link được cập nhật, hệ thống sẽ tự động gửi thông báo trong ứng dụng cho customer.

## Lưu ý

- Meeting link phải là URL hợp lệ
- Chỉ consultant được gán hoặc admin/manager mới có thể cập nhật meeting link
- Customer sẽ nhận được thông báo khi meeting link được cập nhật
