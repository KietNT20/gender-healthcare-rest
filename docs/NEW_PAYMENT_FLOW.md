# New Payment Flow - Quy Trình Thanh Toán Mới

## Tổng Quan Thay Đổi

❌ **Loại bỏ**: Hệ thống hoàn tiền (refund system)  
✅ **Áp dụng**: Flow thanh toán linh hoạt theo loại dịch vụ

## 📋 Flow Thanh Toán Mới

### 1. 💻 **Tư Vấn Trực Tuyến (Online Consultation)**

- **Timing**: Thanh toán TRƯỚC khi bắt đầu tư vấn
- **Method**: PayOS payment link
- **Status**: `COMPLETED` → Có thể tư vấn
- **Use Case**: Video call, chat tư vấn

```typescript
// Flow: Book → Pay → Consult
POST /payments/online-consultation
{
  "appointmentId": "uuid",
  "consultationType": "VIDEO" | "CHAT",
  "amount": 200000
}
```

### 2. 📦 **Gói Dịch Vụ (Service Packages)**

- **Timing**: Thanh toán TRƯỚC khi kích hoạt gói
- **Method**: PayOS payment link
- **Status**: `COMPLETED` → Gói được kích hoạt
- **Use Case**: Gói chăm sóc sức khỏe, gói tư vấn định kỳ

```typescript
// Flow: Select Package → Pay → Activate
POST /payments/service-package
{
  "packageId": "uuid",
  "userId": "uuid",
  "amount": 500000
}
```

### 3. 🏥 **Hẹn Tư Vấn/Dịch Vụ Tại Cơ Sở (Offline Services)**

- **Timing**: Đặt lịch TRƯỚC → Thanh toán SAU khi hoàn thành
- **Method**: Đặt lịch miễn phí, thanh toán tại quầy hoặc sau service
- **Status**: `PENDING` → `COMPLETED` sau khi service xong
- **Use Case**: Khám tại phòng khám, xét nghiệm, tư vấn trực tiếp

```typescript
// Flow: Book Appointment → Attend → Complete Service → Pay
POST /appointments/offline
{
  "serviceId": "uuid",
  "datetime": "2024-01-01T10:00:00Z",
  "consultantId": "uuid"
}

// Sau khi hoàn thành dịch vụ
POST /payments/offline-service
{
  "appointmentId": "uuid",
  "serviceItems": [
    {
      "serviceId": "uuid",
      "quantity": 1,
      "amount": 300000
    }
  ]
}
```

## 🔄 API Endpoints Mới

### Online Services (Pay First)

```typescript
// Tư vấn trực tuyến
POST /payments/online-consultation
GET /payments/online-consultation/:appointmentId/status

// Gói dịch vụ
POST /payments/service-package
GET /payments/service-package/:packageId/status
```

### Offline Services (Pay After)

```typescript
// Đặt lịch (miễn phí)
POST /appointments/offline
GET /appointments/offline/:id

// Thanh toán sau service
POST /payments/offline-service
GET /payments/offline-service/:appointmentId
```

## 📊 Payment Status Flow

### Online Services

```
PENDING → COMPLETED → [Service Available]
```

### Offline Services

```
[Appointment Booked] → [Service Completed] → PENDING → COMPLETED
```

## 🗃️ Database Changes

### Appointment Entity

```typescript
@Column({ type: 'enum' })
appointmentType: 'ONLINE_VIDEO' | 'ONLINE_CHAT' | 'OFFLINE_CLINIC' | 'OFFLINE_HOME';

@Column({ type: 'enum' })
paymentTiming: 'PAY_FIRST' | 'PAY_AFTER';

@Column({ default: false })
serviceCompleted: boolean;

@Column({ nullable: true })
completedAt: Date;
```

### Payment Entity

```typescript
@Column({ type: 'enum' })
paymentType: 'ONLINE_CONSULTATION' | 'SERVICE_PACKAGE' | 'OFFLINE_SERVICE';

@Column({ type: 'enum' })
paymentTiming: 'PREPAID' | 'POSTPAID';
```

## 🚀 Implementation Steps

### 1. Update Entities

- [ ] Modify `Appointment` entity
- [ ] Modify `Payment` entity
- [ ] Add new enums

### 2. Remove Refund System

- [x] Deprecate `PaymentRefundService`
- [ ] Remove refund endpoints from controller
- [ ] Clean up DTOs

### 3. Implement New Services

- [ ] `OnlineConsultationPaymentService`
- [ ] `ServicePackagePaymentService`
- [ ] `OfflineServicePaymentService`

### 4. Update Controllers

- [ ] Separate payment controllers by type
- [ ] Remove refund endpoints
- [ ] Add new payment flows

### 5. Frontend Integration

- [ ] Update payment UI flows
- [ ] Handle different payment timings
- [ ] Remove refund-related UI

## 🎯 Benefits

### ✅ Advantages

- **Simplified**: No complex refund logic
- **Clear**: Different flows for different services
- **Flexible**: Pay before online, pay after offline
- **User-friendly**: Book offline appointments without upfront payment

### 📝 Business Rules

- Online services require payment confirmation before access
- Offline appointments can be booked without payment
- Payment for offline services happens after service completion
- No refunds needed since offline appointments don't require prepayment

## 🔄 Migration Plan

1. **Phase 1**: Implement new payment flows alongside existing
2. **Phase 2**: Migrate existing data to new structure
3. **Phase 3**: Remove refund system completely
4. **Phase 4**: Update frontend to use new flows

## 📞 Use Cases

### Scenario 1: Online Video Consultation

```
User selects doctor → Books time slot → Pays 200k → Gets video link → Consults
```

### Scenario 2: Health Package

```
User selects package → Pays 500k → Package activated → Uses services over time
```

### Scenario 3: Clinic Visit

```
User books appointment → Visits clinic → Receives service → Pays at counter → Done
```

This new flow eliminates refund complexity while providing better user experience for different service types!
