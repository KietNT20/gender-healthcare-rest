# STI Appointment API Flow

Đây là flow các API chính cho việc đặt lịch xét nghiệm STI (Sexually Transmitted Infections) từ lúc bắt đầu đến khi hoàn thành.

---

## 1. Đặt lịch xét nghiệm STI

- **Endpoint:** `POST /sti-appointments`
- **Mục đích:** Khách hàng gửi yêu cầu đặt lịch xét nghiệm STI (chọn dịch vụ, thời gian, địa điểm, tư vấn viên nếu cần).

---

## 2. Nhận thông tin appointment & thanh toán (nếu cần)

- **Endpoint:** `POST /payments/appointments`
- **Mục đích:** Tạo link thanh toán cho lịch xét nghiệm (nếu cần thanh toán trước).

---

## 3. Xác nhận thanh toán (callback/webhook)

- **Endpoint:** `POST /payments/webhook`
- **Mục đích:** Hệ thống nhận xác nhận thanh toán thành công từ cổng thanh toán, cập nhật trạng thái appointment.

---

## 4. Xem danh sách & chi tiết lịch xét nghiệm STI

- **Endpoint:** `GET /sti-appointments` (danh sách)
- **Endpoint:** `GET /sti-appointments/:id` (chi tiết)
- **Mục đích:** Khách hàng xem danh sách và chi tiết các lịch xét nghiệm STI của mình.

---

## 5. Nhắc nhở trước lịch hẹn (tự động)

- **(Cron job, không cần gọi API thủ công)**
- **Mục đích:** Hệ thống tự động gửi notification/email nhắc nhở trước giờ lấy mẫu.

---

## 6. Check-in tại cơ sở

- **Endpoint:** `POST /appointments/:id/check-in`
- **Mục đích:** Khách hàng/staff xác nhận đã đến cơ sở để lấy mẫu xét nghiệm.

---

## 7. Hoàn thành xét nghiệm

- **Endpoint:** `PATCH /appointments/:id/status`
- **Mục đích:** Cập nhật trạng thái appointment sang COMPLETED khi xét nghiệm đã hoàn thành.

---

## 8. Gửi yêu cầu feedback

- **(Tự động khi appointment COMPLETED)**
- **Mục đích:** Hệ thống gửi notification mời khách hàng đánh giá trải nghiệm xét nghiệm.

---

**Lưu ý:**

- Các endpoint có thể yêu cầu xác thực (JWT).
- Khách hàng có thể xem lịch sử xét nghiệm STI qua endpoint `/sti-appointments`.
