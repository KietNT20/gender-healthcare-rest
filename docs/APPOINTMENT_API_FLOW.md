# Appointment API Flow

Đây là flow các API chính cho việc đặt lịch hẹn (appointment) từ lúc bắt đầu đến khi hoàn thành.

---

## 1. Đặt lịch hẹn

- **Endpoint:** `POST /appointments`
- **Mục đích:** Khách hàng gửi yêu cầu đặt lịch (chọn dịch vụ, tư vấn viên, thời gian, địa điểm).

---

## 2. Nhận thông tin appointment & thanh toán (nếu cần)

- **Endpoint:** `POST /payments/appointments`
- **Mục đích:** Tạo link thanh toán cho cuộc hẹn (nếu cần thanh toán trước).

---

## 3. Xác nhận thanh toán (callback/webhook)

- **Endpoint:** `POST /payments/webhook`
- **Mục đích:** Hệ thống nhận xác nhận thanh toán thành công từ cổng thanh toán, cập nhật trạng thái appointment.

---

## 4. Xem danh sách & chi tiết cuộc hẹn

- **Endpoint:** `GET /appointments` (danh sách)
- **Endpoint:** `GET /appointments/me/:id` (chi tiết)
- **Mục đích:** Khách hàng hoặc tư vấn viên xem danh sách và chi tiết các cuộc hẹn của mình.

---

## 5. Nhắc nhở trước lịch hẹn (tự động)

- **(Cron job, không cần gọi API thủ công)**
- **Mục đích:** Hệ thống tự động gửi notification/email nhắc nhở trước giờ hẹn.

---

## 6. Check-in tại cơ sở (nếu là khám trực tiếp)

- **Endpoint:** `POST /appointments/:id/check-in`
- **Mục đích:** Khách hàng/staff xác nhận đã đến cơ sở để thực hiện dịch vụ.

---

## 7. Hoàn thành cuộc hẹn

- **Endpoint:** `PATCH /appointments/:id/status`
- **Mục đích:** Cập nhật trạng thái appointment sang COMPLETED khi dịch vụ đã hoàn thành.

---

## 8. Gửi yêu cầu feedback

- **(Tự động khi appointment COMPLETED)**
- **Mục đích:** Hệ thống gửi notification mời khách hàng đánh giá cuộc hẹn.

---

**Lưu ý:**

- Các endpoint có thể yêu cầu xác thực (JWT).
- Tư vấn viên có thể xem các cuộc hẹn của mình qua endpoint `/appointments/consultant/my-appointments`.
