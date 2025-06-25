# Payment Workflow - Gender Healthcare REST API

## Overview

Hệ thống thanh toán tích hợp với PayOS cho các dịch vụ y tế:

- **Package Payment**: Thanh toán gói dịch vụ (subscription packages)
- **Appointment Payment**: Thanh toán cuộc hẹn
- **Service Payment**: Thanh toán dịch vụ đơn lẻ
- **Webhook Processing**: Xử lý callback từ PayOS
- **Payment Management**: Quản lý và theo dõi thanh toán

## System Architecture

### Payment Providers

1. **PaymentLinkService**: Tạo payment links với PayOS
2. **PaymentCallbackService**: Xử lý callbacks và webhooks
3. **PaymentRepositoryService**: Quản lý database operations
4. **UserPaymentService**: Xử lý thanh toán của user
5. **PayOSService**: Tích hợp với PayOS API

## Payment Flow Types

### 1. Package Payment Flow

#### Client Request

```typescript
POST /payments/packages
{
  packageId: string;
  description?: string;
  metadata?: Record<string, any>;
}
```

#### Process Flow

1. **Validation**: Kiểm tra package có tồn tại và active
2. **Payment Creation**: Tạo payment record với status `PENDING`
3. **PayOS Integration**: Tạo payment link với PayOS
4. **Response**: Trả về payment link và order info

#### Success Flow

1. User hoàn thành thanh toán trên PayOS
2. PayOS gửi webhook notification
3. System xử lý webhook và cập nhật payment status
4. Kích hoạt package subscription cho user

### 2. Appointment Payment Flow

#### Client Request

```typescript
POST /payments/appointments
{
  appointmentId: string;
  description?: string;
  metadata?: Record<string, any>;
}
```

#### Process Flow

1. **Validation**: Kiểm tra appointment có tồn tại và chưa thanh toán
2. **Price Calculation**: Tính toán giá dựa trên services trong appointment
3. **Payment Creation**: Tạo payment record với status `PENDING`
4. **PayOS Integration**: Tạo payment link với PayOS
5. **Response**: Trả về payment link và order info

#### Success Flow

1. User hoàn thành thanh toán trên PayOS
2. PayOS gửi webhook notification
3. System cập nhật payment và appointment status
4. Kích hoạt appointment và gửi notification

### 3. Service Payment Flow

#### Client Request

```typescript
POST /payments/services
{
  serviceId: string;
  quantity?: number;
  description?: string;
  metadata?: Record<string, any>;
}
```

#### Process Flow

1. **Validation**: Kiểm tra service có tồn tại và active
2. **Price Calculation**: Tính toán giá dựa trên service price và quantity
3. **Payment Creation**: Tạo payment record với status `PENDING`
4. **PayOS Integration**: Tạo payment link với PayOS
5. **Response**: Trả về payment link và order info

## Payment Callbacks

### Success Callback

```
GET /payments/success-callback?orderCode={orderCode}
```

#### Process Flow

1. **Payment Lookup**: Tìm payment theo orderCode
2. **Status Update**: Cập nhật status thành `PAID`
3. **Business Logic**: Kích hoạt services/packages tương ứng
4. **Redirect**: Chuyển hướng user về frontend với thông báo thành công

### Cancel Callback

```
GET /payments/cancel-callback?orderCode={orderCode}
```

#### Process Flow

1. **Payment Lookup**: Tìm payment theo orderCode
2. **Status Update**: Cập nhật status thành `CANCELLED`
3. **Cleanup**: Hủy bỏ các tài nguyên đã reserve
4. **Redirect**: Chuyển hướng user về frontend với thông báo hủy

### Webhook Processing

```
POST /payments/webhook
```

#### Webhook Data Structure

```typescript
{
    code: string;
    desc: string;
    success: boolean;
    data: {
        orderCode: number;
        amount: number;
        description: string;
        accountNumber: string;
        reference: string;
        transactionDateTime: string;
        currency: string;
        paymentLinkId: string;
        code: string;
        desc: string;
        counterAccountBankId: string;
        counterAccountBankName: string;
        counterAccountName: string;
        counterAccountNumber: string;
        virtualAccountName: string;
        virtualAccountNumber: string;
    }
    signature: string;
}
```

#### Process Flow

1. **Signature Verification**: Xác thực webhook signature từ PayOS
2. **Payment Lookup**: Tìm payment theo orderCode
3. **Status Processing**: Xử lý theo webhook status
4. **Business Logic**: Kích hoạt tương ứng services/packages
5. **Audit Logging**: Ghi log audit cho các thay đổi

## Appointment Attendance Management

### Overview

Đối với các khách hàng đã đặt lịch và thanh toán dịch vụ tại cơ sở y tế, hệ thống cần xử lý việc khách hàng có đến khám hay không để:

- Đảm bảo quy trình y tế được thực hiện đúng
- Quản lý tài nguyên (phòng khám, thiết bị, nhân viên)
- Xử lý hoàn tiền/phí phạt cho trường hợp không đến
- Theo dõi thống kê attendance rate

### Current Implementation Status

**✅ Đã triển khai:**

- Appointment Entity có fields: `checkInTime`, `checkOutTime`, `reminderSent`, `reminderSentAt`
- AppointmentStatusType enum với các status: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`, `NO_SHOW`, `CHECKED_IN`, `IN_PROGRESS`
- API cập nhật status: `PATCH /appointments/{id}/status` (Admin/Manager/Consultant only)
- UpdateAppointmentDto hỗ trợ cập nhật status: `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `NO_SHOW`
- **🆕 AppointmentAttendanceService**: Service chuyên xử lý attendance business logic
- **🆕 Check-in APIs**: `POST /appointments/{id}/check-in` (Staff/Admin/Manager only)
- **🆕 No-show APIs**: `POST /appointments/{id}/mark-no-show` (Staff/Admin/Manager only)
- **🆕 Late check-in APIs**: `POST /appointments/{id}/late-check-in` (Staff/Admin/Manager only)
- **🆕 Automated cron jobs**: Auto no-show detection (mỗi 15 phút) và pre-appointment reminders (mỗi giờ)
- **🆕 Enhanced notifications**: Check-in, no-show, late arrival notifications
- **🆕 Email templates**: No-show notification email với reschedule link

**❌ Chưa triển khai:**

- Staff dashboard APIs (today's appointments, check-in queue, no-show management)
- Detailed attendance analytics & reporting
- Advanced refund & penalty policies integration với payment system
- External system integrations (HMS, Queue Management)
- Advanced business rules (penalty calculation based on history, etc.)
- Pre-appointment reminders system
- External system integrations

### Current Appointment Status Types

```typescript
enum AppointmentStatusType {
    PENDING = 'pending', // Đã đặt, chưa thanh toán
    CONFIRMED = 'confirmed', // Đã thanh toán/xác nhận, chờ khám
    COMPLETED = 'completed', // Hoàn thành dịch vụ
    CANCELLED = 'cancelled', // Đã hủy
    RESCHEDULED = 'rescheduled', // Đã dời lịch
    NO_SHOW = 'no_show', // Không đến theo lịch hẹn
}
```

**⚠️ Cần bổ sung:**

```typescript
enum AppointmentStatusType {
    // ...existing statuses
    CHECKED_IN = 'checked_in', // Đã check-in tại cơ sở
    IN_PROGRESS = 'in_progress', // Đang thực hiện dịch vụ
}
```

### Current Available APIs

#### 1. Update Appointment Status (Existing)

```typescript
PATCH /appointments/{appointmentId}/status
Authorization: Bearer {admin/manager/consultant_token}

{
  status: 'confirmed' | 'completed' | 'no_show';  // Limited options
  meetingLink?: string;
}
```

**Current Limitations:**

- Chỉ Admin/Manager/Consultant có thể cập nhật
- Không có logic nghiệp vụ phức tạp (penalty, notification, etc.)
- Không có staff role để handle check-in
- Không có validation thời gian

#### 2. Cancel Appointment (Existing)

```typescript
PATCH /appointments/{appointmentId}/cancel
Authorization: Bearer {customer/admin/manager_token}

{
  cancellationReason: string;
}
```

### APIs Cần Triển Khai

#### 1. Staff Check-in API

```typescript
POST /appointments/{appointmentId}/check-in
Authorization: Bearer {staff_token}

{
  checkInTime?: Date;           // Mặc định là thời gian hiện tại
  notes?: string;               // Ghi chú từ lễ tân
  actualServices?: string[];    // Danh sách services thực tế (có thể khác đặt ban đầu)
}
```

#### 2. Manual No-Show Marking

```typescript
POST /appointments/{appointmentId}/mark-no-show
Authorization: Bearer {staff_token}

{
  reason: string;               // Lý do đánh dấu no-show
  contactAttempts?: number;     // Số lần đã cố gắng liên hệ
  notes?: string;               // Ghi chú thêm
  applyPenalty?: boolean;       // Có áp dụng phí phạt không
}
```

#### 3. Late Check-in API

```typescript
POST /appointments/{appointmentId}/late-check-in
Authorization: Bearer {staff_token}

{
  actualArrivalTime: Date;
  lateFee?: number;             // Phí trễ giờ (nếu có)
  adjustedServices?: string[];  // Dịch vụ điều chỉnh do thiếu thời gian
  notes?: string;
}
```

#### 4. Staff Dashboard APIs

```typescript
// Today's appointments overview
GET /appointments/staff/today
Authorization: Bearer {staff_token}

// Check-in queue management
GET /appointments/staff/check-in-queue
Authorization: Bearer {staff_token}

// No-show management
GET /appointments/staff/no-shows?date={date}&status={status}
Authorization: Bearer {staff_token}
```

### Required Database Changes

#### 1. Update AppointmentStatusType Enum

```sql
-- Thêm status mới
ALTER TYPE "AppointmentStatusType" ADD VALUE 'checked_in';
ALTER TYPE "AppointmentStatusType" ADD VALUE 'in_progress';
```

#### 2. Add Staff Role Support

```sql
-- Đảm bảo STAFF role tồn tại trong RolesNameEnum
-- Cần update guards để hỗ trợ STAFF role cho appointment APIs
```

#### 3. Attendance Tracking Fields (Optional)

```sql
-- Có thể thêm fields cho tracking chi tiết hơn
ALTER TABLE "appointment" ADD COLUMN "actual_arrival_time" TIMESTAMP;
ALTER TABLE "appointment" ADD COLUMN "late_fee" DECIMAL(10,2);
ALTER TABLE "appointment" ADD COLUMN "no_show_reason" TEXT;
ALTER TABLE "appointment" ADD COLUMN "staff_notes" TEXT;
```

### Required Service Implementations

#### 1. AppointmentAttendanceService

```typescript
@Injectable()
export class AppointmentAttendanceService {
    // Check-in logic
    async checkInPatient(
        appointmentId: string,
        checkInData: CheckInDto,
    ): Promise<Appointment>;

    // No-show detection and processing
    async processNoShow(
        appointmentId: string,
        noShowData: NoShowDto,
    ): Promise<Appointment>;

    // Late arrival handling
    async processLateArrival(
        appointmentId: string,
        lateData: LateArrivalDto,
    ): Promise<Appointment>;

    // Grace period and penalty calculations
    async calculateLateFee(
        appointment: Appointment,
        actualArrival: Date,
    ): Promise<number>;
}
```

#### 2. Scheduled Jobs for Auto No-Show Detection

```typescript
@Injectable()
export class AppointmentCronService {
    @Cron('*/15 * * * *') // Chạy mỗi 15 phút
    async checkNoShowAppointments() {
        // Tìm appointments đã quá 30 phút mà chưa check-in
        // Tự động đánh dấu no-show
    }

    @Cron('0 */1 * * *') // Chạy mỗi giờ
    async sendPreAppointmentReminders() {
        // Gửi reminder 24h, 2h, 30 phút trước appointment
    }
}
```

#### 3. Enhanced Notification Service

```typescript
@Injectable()
export class AppointmentNotificationService {
    // Current: basic notifications
    // Need: no-show notifications, late arrival notifications, staff notifications

    async sendNoShowNotification(appointment: Appointment): Promise<void>;
    async sendLateArrivalNotification(appointment: Appointment): Promise<void>;
    async notifyStaffOfCheckIn(appointment: Appointment): Promise<void>;
}
```

### Implementation Priority

**Phase 1 - Critical APIs (2-3 days)**

1. Update RolesNameEnum để include STAFF
2. Update appointment guards để support STAFF role
3. Implement basic check-in API
4. Implement manual no-show marking API

**Phase 2 - Staff Dashboard (3-4 days)**

1. Staff today's appointments API
2. Check-in queue management API
3. Basic attendance statistics API

**Phase 3 - Automation & Advanced Features (5-7 days)**

1. Scheduled jobs for auto no-show detection
2. Late arrival handling with fee calculation
3. Enhanced notification system
4. Detailed analytics and reporting

**Phase 4 - External Integrations (Optional)**

1. Queue management system integration
2. Hospital management system sync
3. SMS/Push notification integrations

### Notes for Developers

**Current Codebase Analysis:**

- Appointment entity đã có sẵn `checkInTime` và `checkOutTime` fields
- AppointmentStatusType enum đã có `NO_SHOW` status
- UpdateAppointmentDto đã support update status including `NO_SHOW`
- Tuy nhiên, chưa có logic nghiệp vụ và APIs chi tiết cho attendance management

**Các file cần sửa đổi:**

1. `src/enums/index.ts` - Thêm CHECKED_IN, IN_PROGRESS status
2. `src/modules/appointments/appointments.controller.ts` - Thêm attendance endpoints
3. `src/modules/appointments/appointments.service.ts` - Thêm attendance business logic
4. `src/modules/appointments/dto/` - Tạo DTOs cho check-in, no-show, late arrival
5. Tạo `AppointmentAttendanceService` để handle complex attendance logic
6. Tạo scheduled jobs cho auto no-show detection
7. Update guards và permissions cho STAFF role

**Testing Requirements:**

- Unit tests cho attendance logic
- Integration tests cho attendance APIs
- E2E tests cho complete attendance flow
- Load testing cho cron jobs

## Payment Status Management

### Payment Status Types

```typescript
enum PaymentStatusType {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}
```

### Status Transitions

- `PENDING` → `PROCESSING` (When payment is initiated)
- `PROCESSING` → `PAID` (When payment is successful)
- `PROCESSING` → `FAILED` (When payment fails)
- `PENDING/PROCESSING` → `CANCELLED` (When user cancels)
- `PAID` → `REFUNDED` (When refund is processed)

## User Payment Management

### Get User Payments

```typescript
GET /payments/user/my-payments?status={status}
```

### Get Payment Details

```typescript
GET / payments / user / { paymentId };
```

### Cancel User Payment

```typescript
PATCH /payments/user/{paymentId}/cancel
{
  reason: string;
  description?: string;
}
```

### User Payment Statistics

```typescript
GET / payments / user / stats;
```

Response:

```typescript
{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    pendingPayments: number;
    cancelledPayments: number;
    monthlyStats: {
        month: string;
        count: number;
        amount: number;
    }
    [];
}
```

## Admin Payment Management

### Get All Payments

```typescript
GET /payments (Admin only)
```

### Get Payment by ID

```typescript
GET /payments/{id} (Admin only)
```

### Cancel Payment

```typescript
PATCH /payments/{id}/cancel (Admin only)
{
  reason: string;
  description?: string;
  notifyUser?: boolean;
}
```

### Soft Delete Payment

```typescript
DELETE /payments/{id} (Admin only)
```

## Security & Validation

### Payment Security

1. **Signature Verification**: Tất cả webhooks từ PayOS được verify signature
2. **User Authorization**: User chỉ có thể truy cập payments của mình
3. **Admin Authorization**: Admin operations yêu cầu role `ADMIN`
4. **Input Validation**: Tất cả inputs được validate với DTO

### Validation Rules

- Package/Appointment/Service phải tồn tại và active
- User phải có quyền tạo payment cho resource
- Amount phải > 0 và match với expected price
- OrderCode phải unique trong hệ thống

## Error Handling

### Common Error Cases

1. **Invalid Payment Data**: Trả về 400 Bad Request
2. **Resource Not Found**: Trả về 404 Not Found
3. **Unauthorized Access**: Trả về 403 Forbidden
4. **PayOS API Error**: Trả về 502 Bad Gateway
5. **Webhook Verification Failed**: Trả về 401 Unauthorized

### Error Response Format

```typescript
{
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    path: string;
}
```

## Configuration

### Environment Variables

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# Frontend URLs
FRONTEND_URL=https://your-frontend.com
DEFAULT_FRONTEND_DOMAIN=https://your-frontend.com

# Backend URLs
APP_URL=https://your-backend.com
```

### PayOS Integration

- **Client ID**: Định danh ứng dụng với PayOS
- **API Key**: Key để call PayOS APIs
- **Checksum Key**: Key để verify webhook signatures

## Monitoring & Logging

### Audit Logs

Tất cả payment operations được ghi audit logs:

- Payment creation
- Status changes
- User actions
- Admin actions
- Webhook processing

### Metrics to Monitor

- Payment success rate
- Average payment processing time
- Failed payment reasons
- Webhook processing latency
- User payment behavior

## Testing

### Unit Tests

- Payment service methods
- Validation logic
- Status transitions
- Error handling

### Integration Tests

- PayOS API integration
- Webhook processing
- Database operations
- Authorization flows

### E2E Tests

- Complete payment flows
- Callback handling
- Error scenarios
- User journeys

## Troubleshooting

### Common Issues

1. **Webhook Not Received**

    - Check PayOS webhook configuration
    - Verify network connectivity
    - Check webhook endpoint availability

2. **Payment Status Not Updated**

    - Check webhook signature verification
    - Verify payment lookup logic
    - Check database transaction handling

3. **User Can't Access Payment**

    - Verify user authorization
    - Check payment ownership
    - Validate JWT token

4. **PayOS API Errors**
    - Check API credentials
    - Verify request format
    - Check PayOS service status

### Debug Steps

1. Check payment logs in audit system
2. Verify PayOS webhook delivery
3. Check database payment status
4. Validate user permissions
5. Review error logs and stack traces
