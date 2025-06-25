# Payment Refund System Documentation

## Overview

Hệ thống hoàn tiền được thiết kế để xử lý các trường hợp hoàn tiền khác nhau trong ứng dụng healthcare, bao gồm việc hủy cuộc hẹn, không đến, và đến muộn.

## Current State: Manual Processing Required

**Quan trọng**: PayOS hiện tại chưa hỗ trợ API hoàn tiền tự động. Tất cả các yêu cầu hoàn tiền sẽ được đánh dấu để xử lý thủ công.

## Refund Types

### 1. Appointment Cancellation Refund

- **Endpoint**: `POST /payments/refunds/appointment-cancellation`
- **Description**: Xử lý hoàn tiền khi bệnh nhân hủy cuộc hẹn
- **Penalty Logic**:
    - ≥24 giờ trước: Không phạt
    - <24 giờ: Phạt 25%
    - <2 giờ: Phạt 50%

### 2. No-Show Refund

- **Endpoint**: `POST /payments/refunds/no-show/{appointmentId}`
- **Description**: Xử lý hoàn tiền khi bệnh nhân không đến
- **Default**: 100% penalty (không hoàn tiền)

### 3. Late Arrival Refund

- **Endpoint**: `POST /payments/refunds/late-arrival/{appointmentId}`
- **Description**: Xử lý hoàn tiền khi bệnh nhân đến muộn
- **Penalty Logic**:
    - ≤30 phút: Không phạt
    - 31-45 phút: Phạt 15%
    - 46-60 phút: Phạt 25%
    - > 60 phút: Phạt 100%

## Manual Refund Process

### 1. Automatic Detection

Khi hệ thống không thể xử lý hoàn tiền tự động qua PayOS:

- Tạo `refundReference` với format: `MANUAL_{timestamp}_{paymentId_suffix}`
- Log chi tiết yêu cầu hoàn tiền
- Đánh dấu `requiresManualProcessing: true`

### 2. Admin Dashboard

- **Get Pending**: `GET /payments/refunds/manual/pending`
- **Complete Manual**: `POST /payments/refunds/manual/complete`

### 3. Manual Process Steps

1. Admin nhận thông báo có yêu cầu hoàn tiền thủ công
2. Xác minh thông tin thanh toán trong PayOS dashboard
3. Thực hiện hoàn tiền thủ công qua PayOS interface
4. Cập nhật hệ thống bằng endpoint complete manual refund

## API Endpoints

### Refund Processing

```typescript
// Appointment cancellation
POST /payments/refunds/appointment-cancellation
{
  "appointmentId": "uuid",
  "reason": "string",
  "penaltyAmount": number // optional
}

// No-show
POST /payments/refunds/no-show/{appointmentId}?penaltyPercentage=100

// Late arrival
POST /payments/refunds/late-arrival/{appointmentId}?lateMinutes=45
```

### Status & Management

```typescript
// Check refund status
GET /payments/refunds/status/{paymentId}

// Check eligibility
GET /payments/refunds/eligibility/{paymentId}?amount=100000

// Complete manual refund (Admin)
POST /payments/refunds/manual/complete
{
  "refundReference": "MANUAL_1671234567890_abc123",
  "processedBy": "admin_user_id",
  "notes": "Processed via PayOS dashboard"
}

// Get pending manual refunds (Admin)
GET /payments/refunds/manual/pending
```

## Response Format

### RefundResult

```typescript
{
  "paymentId": "uuid",
  "originalAmount": 200000,
  "refundAmount": 150000,
  "penaltyAmount": 50000,
  "netRefundAmount": 150000,
  "refundStatus": "PENDING" | "SUCCESS" | "FAILED",
  "refundReference": "MANUAL_1671234567890_abc123",
  "processedAt": "2024-01-01T00:00:00Z",
  "reason": "Appointment cancelled",
  "warnings": ["Penalty of 50,000 VND applied"],
  "requiresManualProcessing": true
}
```

## Future PayOS Integration

### When PayOS Refund API Becomes Available

1. Update `checkPayOSRefundSupport()` to return `true`
2. Implement `processPayOSRefund()` method with actual API calls
3. Update PayOSService to include refund methods
4. Test thoroughly with PayOS sandbox

### Recommended PayOS Refund Implementation

```typescript
// In PayOSService
async processRefund(refundRequest: {
  orderCode: string;
  amount: number;
  reason: string;
}): Promise<PayOSRefundResponse> {
  // Implementation when API becomes available
}
```

## Error Handling

### Common Scenarios

- **Payment not found**: 404 with clear message
- **Invalid payment status**: 400 with status explanation
- **Refund amount exceeds original**: 400 with validation error
- **PayOS API failure**: Log error, mark for manual processing

### Logging

All refund operations are logged with:

- Payment ID
- Refund amount
- Reason
- Processing method (auto/manual)
- Timestamps
- User who initiated

## Security Considerations

### Access Control

- **Staff/Admin**: Can process all refund types
- **Users**: Can only view their own refund status
- **Manual completion**: Admin only

### Audit Trail

- All refund operations logged
- Manual processing tracked with admin user ID
- Refund references for external reconciliation

## Monitoring & Alerts

### Key Metrics

- Pending manual refunds count
- Average processing time
- Refund success/failure rates
- Penalty amounts by refund type

### Alerts

- New manual refund requests
- Failed automatic processing
- Unusual refund patterns

## Testing

### Test Cases

1. **Cancellation scenarios**: Various timing before appointment
2. **No-show handling**: Different penalty percentages
3. **Late arrival**: Various delay durations
4. **Manual processing**: Complete workflow
5. **Edge cases**: Zero amounts, duplicate requests

### Mock Data

Use test appointments and payments to verify:

- Penalty calculations
- Status updates
- Manual workflow
- API responses
