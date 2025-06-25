# Hướng Dẫn Hoàn Tiền Thủ Công (Manual Refund)

## Tổng Quan

Hệ thống hoàn tiền hiện tại được thiết kế để xử lý hoàn tiền **THỦ CÔNG** vì PayOS chưa hỗ trợ API hoàn tiền tự động.

## Quy Trình Hoàn Tiền

### 1. Khởi Tạo Yêu Cầu Hoàn Tiền

Khi có yêu cầu hoàn tiền (hủy cuộc hẹn, không đến, đến muộn), hệ thống sẽ:

- Tính toán số tiền hoàn và phí phạt
- Tạo `refundReference` với format: `MANUAL_1672234567890_abc12345`
- Log chi tiết để admin xử lý
- Trả về trạng thái `PENDING` và `requiresManualProcessing: true`

### 2. Admin Xử Lý Hoàn Tiền

Admin cần thực hiện các bước sau:

1. **Kiểm tra log yêu cầu hoàn tiền:**

    ```
    🔄 YÊU CẦU HOÀN TIỀN THỦ CÔNG:
    {
      "paymentId": "uuid-here",
      "refundAmount": 150000,
      "reason": "Appointment cancelled",
      "refundReference": "MANUAL_1672234567890_abc12345"
    }
    ```

2. **Hoàn tiền qua PayOS Dashboard:**

    - Đăng nhập vào PayOS dashboard
    - Tìm giao dịch bằng payment ID hoặc order code
    - Thực hiện hoàn tiền thủ công

3. **Cập nhật hệ thống:**
    ```bash
    POST /payments/refunds/manual/complete
    {
      "refundReference": "MANUAL_1672234567890_abc12345",
      "processedBy": "admin_user_id",
      "notes": "Đã hoàn tiền qua PayOS dashboard"
    }
    ```

## API Endpoints

### Xử Lý Hoàn Tiền Tự Động

```typescript
// Hủy cuộc hẹn
POST /payments/refunds/appointment-cancellation
{
  "appointmentId": "uuid",
  "reason": "Patient cancelled",
  "penaltyAmount": 50000  // optional
}

// No-show (mặc định phạt 100%)
POST /payments/refunds/no-show/{appointmentId}?penaltyPercentage=100

// Đến muộn
POST /payments/refunds/late-arrival/{appointmentId}?lateMinutes=45
```

### Quản Lý Manual Refund

```typescript
// Hoàn thành hoàn tiền thủ công (Admin only)
POST /payments/refunds/manual/complete
{
  "refundReference": "MANUAL_1672234567890_abc12345",
  "processedBy": "admin_user_id",
  "notes": "Processed via PayOS dashboard"
}

// Kiểm tra trạng thái hoàn tiền
GET /payments/refunds/status/{paymentId}

// Kiểm tra điều kiện hoàn tiền
GET /payments/refunds/eligibility/{paymentId}
```

## Quy Tắc Phạt

### Hủy Cuộc Hẹn

- **≥24 giờ trước**: Không phạt
- **<24 giờ**: Phạt 25%
- **<2 giờ**: Phạt 50%

### Đến Muộn

- **≤30 phút**: Không phạt
- **31-45 phút**: Phạt 15%
- **46-60 phút**: Phạt 25%
- **>60 phút**: Phạt 100% (hủy tự động)

### No-Show

- **Mặc định**: Phạt 100% (không hoàn tiền)

## Ví Dụ Thực Tế

### Scenario 1: Hủy Cuộc Hẹn (1 giờ trước)

```json
// Request
POST /payments/refunds/appointment-cancellation
{
  "appointmentId": "appt-123",
  "reason": "Patient emergency",
  "penaltyAmount": 100000
}

// Response
{
  "paymentId": "pay-456",
  "originalAmount": 200000,
  "refundAmount": 100000,
  "penaltyAmount": 100000,
  "refundStatus": "PENDING",
  "refundReference": "MANUAL_1672234567890_abc12345",
  "requiresManualProcessing": true,
  "warnings": ["Penalty of 100,000 VND applied"]
}
```

### Scenario 2: Admin Hoàn Thành

```json
// Admin hoàn tiền qua PayOS, sau đó gọi:
POST /payments/refunds/manual/complete
{
  "refundReference": "MANUAL_1672234567890_abc12345",
  "processedBy": "admin-001",
  "notes": "Refunded 100,000 VND via PayOS dashboard"
}

// System updates payment status to REFUNDED
```

## Lưu Ý Quan Trọng

1. **Luôn kiểm tra log** để biết các yêu cầu hoàn tiền mới
2. **Xác minh số tiền** trước khi hoàn tiền qua PayOS
3. **Gọi API complete** sau khi hoàn tiền thành công
4. **Lưu refund reference** để tracking

## Monitoring

- Tất cả hoàn tiền được log với emoji để dễ tìm: 🔄 ✅ ❌
- Refund reference để track và reconcile
- Payment status được cập nhật tự động
