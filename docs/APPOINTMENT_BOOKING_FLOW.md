# Appointment Booking & Management Flow - Comprehensive Healthcare Services

## 🚀 Quick Reference Guide

### 📊 Implementation Status

- **Staff Dashboard**: ❌ **Missing APIs**

### 🎯 Key APIs Ready for Use

| Endpoint                               | Purpose                   | Status   | Auth Required            |
| -------------------------------------- | ------------------------- | -------- | ------------------------ |
| `GET /appointments/available-slots`    | Tìm slot khả dụng         | ✅ Ready | Customer                 |
| `POST /appointments`                   | Đặt lịch                  | ✅ Ready | Customer                 |
| `GET /appointments`                    | Danh sách appointments    | ✅ Ready | All roles                |
| `GET /appointments/:id`                | Chi tiết appointment      | ✅ Ready | All roles                |
| `GET /appointments/:id/chat-room`      | Chat room của appointment | ✅ Ready | All roles                |
| `PATCH /appointments/:id/status`       | Cập nhật trạng thái       | ✅ Ready | Admin/Manager/Consultant |
| `PATCH /appointments/:id/cancel`       | Hủy appointment           | ✅ Ready | Customer/Admin/Manager   |
| `POST /appointments/:id/check-in`      | Check-in bệnh nhân        | ✅ Ready | Staff/Admin/Manager      |
| `POST /appointments/:id/mark-no-show`  | Đánh dấu no-show          | ✅ Ready | Staff/Admin/Manager      |
| `POST /appointments/:id/late-check-in` | Xử lý đến trễ (≤60min)    | ✅ Ready | Staff/Admin/Manager      |

### 🤖 Automation Features

- **Late Appointment Processing**: Cron job mỗi 15 phút - Auto-cancel sau 60 phút
- **Reminder System**: Gửi reminder 24h/2h/30min trước
- **Resource Release**: Tự động giải phóng slot khi cancel/no-show
- **No-show Processing**: Manual marking với penalty option
- **Payment Refund**: Tự động xử lý hoàn trả theo policy

---

## System Status Overview

### ✅ **IMPLEMENTED FEATURES**

- **Core Booking System**: Đặt lịch với validation linh hoạt
- **Attendance Management**: Check-in, no-show, late arrival với automation
- **Status Management**: Quản lý trạng thái appointment đầy đủ
- **Role-based Access**: Phân quyền theo vai trò người dùng
- **Notification System**: Gửi thông báo cho các sự kiện attendance
- **Auto Cron Jobs**: Tự động phát hiện no-show và gửi reminder
- **Payment Refund System**: Xử lý hoàn trả tự động cho cancel/no-show/late

### ⚠️ **PARTIALLY IMPLEMENTED**

- **Dashboard APIs**: Cần bổ sung APIs cho staff dashboard
- **Analytics**: Chưa có báo cáo chi tiết về attendance

## Overview

Hệ thống đặt lịch hẹn và quản lý attendance bao quát cho các cơ sở y tế với nhiều loại dịch vụ:

- **Dịch vụ tư vấn**: Yêu cầu chọn tư vấn viên cụ thể
- **Dịch vụ xét nghiệm**: Không yêu cầu tư vấn viên
- **Dịch vụ kiểm tra sức khỏe**: Không yêu cầu tư vấn viên
- **Dịch vụ khác**: Tùy cấu hình
- **Attendance Management**: Quản lý check-in, no-show, late arrival với automation

## Service Configuration

### New Field: `requiresConsultant`

Mỗi service có field `requiresConsultant` (boolean) để xác định:

- `true`: Dịch vụ yêu cầu chọn tư vấn viên (consultation, therapy)
- `false`: Dịch vụ không yêu cầu tư vấn viên (lab test, health checkup)

## API Endpoints

### 📋 **BOOKING APIs** (✅ Implemented)

#### 1. GET `/appointments/available-slots` - Tìm kiếm slot khả dụng

**Status**: ✅ **IMPLEMENTED**  
**Authentication**: Customer role required
**Description**: Chỉ trả về slot cho các dịch vụ yêu cầu tư vấn viên

**Query Parameters**:

```typescript
{
  serviceIds: string[];           // Required: Danh sách ID dịch vụ
  startDate: string;             // Required: Ngày bắt đầu tìm kiếm (YYYY-MM-DD)
  endDate?: string;              // Optional: Ngày kết thúc (mặc định +7 ngày)
  startTime?: string;            // Optional: Giờ bắt đầu (mặc định 08:00)
  endTime?: string;              // Optional: Giờ kết thúc (mặc định 18:00)
  consultantId?: string;         // Optional: Tìm slot cho tư vấn viên cụ thể
}
```

**Response**:

```typescript
{
  success: boolean;
  message: string;
  data: {
    availableSlots: AvailableSlotDto[];
    totalSlots: number;
    totalConsultants: number;
    message?: string;            // "Các dịch vụ được chọn không yêu cầu tư vấn viên."
  }
}
```

#### 2. POST `/appointments` - Đặt lịch hẹn (Flexible)

**Status**: ✅ **IMPLEMENTED**  
**Authentication**: Customer role required
**Description**: Đặt cuộc hẹn linh hoạt theo loại dịch vụ

**Body**:

```typescript
{
  serviceIds: string[];                    // Required: Danh sách ID dịch vụ
  consultantId?: string;                   // Optional: ID tư vấn viên (bắt buộc cho dịch vụ tư vấn)
  appointmentDate: Date;                   // Required: Ngày giờ cuộc hẹn
  appointmentLocation: LocationTypeEnum;   // Required: Online/Office
  notes?: string;                          // Optional: Ghi chú
}
```

**Validation Logic**:

- Nếu có dịch vụ với `requiresConsultant = true` → `consultantId` bắt buộc
- Nếu tất cả dịch vụ đều `requiresConsultant = false` → `consultantId` optional

**Response**:

```typescript
{
    success: boolean;
    message: string;
    data: Appointment; // Chi tiết appointment vừa tạo
}
```

### 📊 **MANAGEMENT APIs** (✅ Implemented)

#### 3. GET `/appointments` - Danh sách appointments (role-based)

**Status**: ✅ **IMPLEMENTED**  
**Authentication**: All roles (JWT required)
**Description**: Lấy danh sách appointments với phân quyền theo role

**Query Parameters**:

```typescript
{
  userId?: string;              // Lọc theo ID khách hàng
  consultantId?: string;        // Lọc theo ID tư vấn viên
  status?: AppointmentStatusType; // Lọc theo trạng thái
  fromDate?: string;            // Lọc từ ngày (YYYY-MM-DD)
  toDate?: string;              // Lọc đến ngày (YYYY-MM-DD)
  page?: number;                // Trang (mặc định 1)
  limit?: number;               // Số item/trang (mặc định 10)
  sortBy?: string;              // Sắp xếp theo field (appointmentDate, createdAt, updatedAt)
  sortOrder?: 'ASC' | 'DESC';   // Thứ tự sắp xếp (mặc định DESC)
}
```

#### 4. GET `/appointments/:id` - Chi tiết appointment

**Status**: ✅ **IMPLEMENTED**  
**Authentication**: All roles (JWT required)
**Description**: Lấy chi tiết appointment với phân quyền

#### 5. GET `/appointments/:id/chat-room` - Chat room của appointment

**Status**: ✅ **IMPLEMENTED**  
**Authentication**: All roles (JWT required)
**Description**: Lấy chat room cho appointment (nếu có)

#### 6. PATCH `/appointments/:id/status` - Cập nhật trạng thái appointment

**Status**: ✅ **IMPLEMENTED**  
**Authentication**: Admin/Manager/Consultant only
**Description**: Cập nhật trạng thái appointment

**Body**:

```typescript
{
  status?: 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'no_show';
  meetingLink?: string;  // Optional: Link phòng họp cho tư vấn online
}
```

#### 7. PATCH `/appointments/:id/cancel` - Hủy appointment

**Status**: ✅ **IMPLEMENTED**  
**Authentication**: Customer/Admin/Manager
**Description**: Hủy appointment với xử lý refund tự động

**Body**:

```typescript
{
    cancellationReason: string; // Required: Lý do hủy lịch hẹn
}
```

**Refund Policy**:

- **24+ giờ trước**: Hoàn trả 100% (không phí phạt)
- **2-24 giờ trước**: Hoàn trả 75% (phí phạt 25%)
- **< 2 giờ trước**: Hoàn trả 50% (phí phạt 50%)

### 🏥 **ATTENDANCE APIs** (✅ Implemented)

#### 8. POST `/appointments/:id/check-in` - Check-in bệnh nhân

**Status**: ✅ **IMPLEMENTED**  
**Authentication**: Staff/Admin/Manager only
**Description**: Check-in bệnh nhân tại cơ sở y tế

**Body**:

```typescript
{
  checkInTime?: Date;           // Optional: Thời gian check-in (mặc định hiện tại)
  notes?: string;               // Optional: Ghi chú từ lễ tân
  actualServices?: string[];    // Optional: Services thực tế (có thể khác đặt ban đầu)
}
```

**Response**:

```typescript
{
  success: boolean;
  message: string;
  data: {
    appointmentId: string;
    checkInTime: Date;
    estimatedWaitTime: number;    // Thời gian chờ dự kiến (phút)
    assignedRoom?: string;        // Phòng được phân bổ
    nextSteps: string[];          // Hướng dẫn bước tiếp theo
    status: string;
  }
}
```

#### 9. POST `/appointments/:id/mark-no-show` - Đánh dấu no-show

**Status**: ✅ **IMPLEMENTED**  
**Authentication**: Staff/Admin/Manager only
**Description**: Đánh dấu appointment là no-show với xử lý refund tự động

**Body**:

```typescript
{
  reason: string;               // Required: Lý do đánh dấu no-show
  contactAttempts?: number;     // Optional: Số lần đã cố gắng liên hệ
  notes?: string;               // Optional: Ghi chú thêm
}
```

**Response**:

```typescript
{
    success: boolean;
    message: string;
    data: {
        appointmentId: string;
        reason: string;
        notificationSent: boolean;
        status: string;
    }
}
```

**Refund Policy**: 100% penalty (không hoàn trả) cho no-show

#### 10. POST `/appointments/:id/late-check-in` - Xử lý check-in trễ

**Status**: ✅ **IMPLEMENTED**  
**Authentication**: Staff/Admin/Manager only
**Description**: Xử lý check-in trễ cho appointment

**Body**:

```typescript
{
  actualArrivalTime: Date;      // Required: Thời gian đến thực tế
  adjustedServices?: string[];  // Optional: Dịch vụ điều chỉnh do thiếu thời gian
  notes?: string;               // Optional: Ghi chú về việc đến trễ
}
```

**Response**:

```typescript
{
  success: boolean;
  message: string;
  data: {
    appointmentId: string;
    actualArrivalTime: Date;
    adjustedServices: string[];
    estimatedWaitTime: number;
    status: string;
    warnings: string[];          // Cảnh báo về việc đến trễ
  }
}
```

**Late Policy & Refund**:

- **0-30 phút**: Không phí phạt, hoàn trả 100%
- **30-45 phút**: Phí phạt 15%, hoàn trả 85%
- **45-60 phút**: Phí phạt 25%, hoàn trả 75%
- **> 60 phút**: Auto-cancel, phí phạt 100% (không hoàn trả)

### 🔍 **QUERY APIs** (✅ Implemented)

#### 11. GET `/appointments` - Danh sách appointments (role-based)

**Status**: ✅ **IMPLEMENTED**  
**Description**: Đã mô tả ở mục 3

#### 12. GET `/appointments/:id` - Chi tiết appointment

**Status**: ✅ **IMPLEMENTED**  
**Description**: Đã mô tả ở mục 4

#### 13. GET `/appointments/:id/chat-room` - Chat room của appointment

**Status**: ✅ **IMPLEMENTED**  
**Description**: Đã mô tả ở mục 5

### 🚧 **MISSING APIs** (⚠️ Need Implementation)

#### 14. GET `/appointments/dashboard/today` - Staff dashboard hôm nay

**Status**: ❌ **NOT IMPLEMENTED**  
**Description**: Dashboard cho staff xem appointments hôm nay

**Proposed Response**:

```typescript
{
  success: boolean;
  data: {
    totalAppointments: number;
    checkedIn: number;
    pending: number;
    noShows: number;
    appointments: AppointmentSummary[];
    waitingQueue: QueueItem[];
  }
}
```

#### 15. GET `/appointments/dashboard/check-in-queue` - Hàng đợi check-in

**Status**: ❌ **NOT IMPLEMENTED**  
**Description**: Danh sách bệnh nhân đang chờ check-in

#### 16. GET `/appointments/analytics/attendance` - Báo cáo attendance

**Status**: ❌ **NOT IMPLEMENTED**  
**Description**: Thống kê về attendance, no-show rates

## Frontend Integration Guide

### 🔐 **Authentication Requirements**

Tất cả APIs yêu cầu JWT Bearer token trong header:

```javascript
const headers = {
    Authorization: 'Bearer your_jwt_token_here',
    'Content-Type': 'application/json',
};
```

### 📱 **Frontend Flow Examples**

#### Customer Booking Flow:

```javascript
// 1. Customer chọn services và tìm available slots
const availableSlots = await fetch(
    '/appointments/available-slots?' +
        new URLSearchParams({
            serviceIds: ['service-1', 'service-2'],
            startDate: '2025-06-26',
        }),
    { headers },
);

// 2. Customer chọn slot và book appointment
const appointment = await fetch('/appointments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        serviceIds: ['service-1', 'service-2'],
        consultantId: 'selected-consultant-id',
        appointmentDate: '2025-06-26T10:00:00Z',
        appointmentLocation: 'OFFICE',
        notes: 'First time patient',
    }),
});

// 3. Get appointment details
const appointmentDetails = await fetch('/appointments/appointment-id', {
    headers,
});
```

#### Staff Check-in Flow:

```javascript
// 1. Staff searches for today's appointments
const todayAppointments = await fetch(
    '/appointments?' +
        new URLSearchParams({
            fromDate: '2025-06-25',
            toDate: '2025-06-25',
            status: 'confirmed',
        }),
    { headers },
);

// 2. Check-in patient
const checkInResult = await fetch('/appointments/appointment-id/check-in', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        checkInTime: new Date(),
        notes: 'Patient arrived on time',
    }),
});

// 3. Handle late arrivals
const lateCheckIn = await fetch('/appointments/appointment-id/late-check-in', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        actualArrivalTime: new Date(),
        notes: 'Patient arrived 30 minutes late due to traffic',
    }),
});
```

#### Cancel & Refund Flow:

```javascript
// Cancel appointment with automatic refund processing
const cancelResult = await fetch('/appointments/appointment-id/cancel', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
        cancellationReason: 'Patient sick, cannot attend',
    }),
});

// Response includes refund information
const response = await cancelResult.json();
// response.data will include refund details if payment was processed
```

### 💰 **Payment Refund Integration**

The system automatically processes refunds for:

- **Appointment Cancellations**: Based on timing
- **No-show Events**: Usually 100% penalty
- **Late Arrivals**: Progressive penalty based on delay

**Refund Response Structure**:

```typescript
{
  success: boolean;
  message: string;
  data: {
    appointmentId: string;
    refundProcessed: boolean;
    refundAmount: number;
    penaltyAmount: number;
    refundStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
    refundReference?: string;
  }
}
```

## User Flows

### 🎯 **Core Booking Flows** (✅ All Implemented)

#### Flow 1: Chỉ dịch vụ không yêu cầu tư vấn viên (Lab Test, Health Checkup)

**Status**: ✅ **FULLY IMPLEMENTED**

```javascript
// Customer chọn serviceIds (lab tests, health checkup)
const appointment = await fetch('/appointments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        serviceIds: ['blood-test-uuid', 'urine-test-uuid'],
        appointmentDate: '2025-06-25T09:00:00Z',
        appointmentLocation: 'OFFICE',
        // consultantId không cần thiết
    }),
});
// Appointment được tạo với status CONFIRMED
// Không tạo chat room
```

#### Flow 2: Chỉ dịch vụ yêu cầu tư vấn viên (Consultation)

**Status**: ✅ **FULLY IMPLEMENTED**

```javascript
// 1. Customer chọn serviceIds (consultation services)
const slots = await fetch(
    '/appointments/available-slots?' +
        new URLSearchParams({
            serviceIds: ['nutrition-consultation-uuid'],
            startDate: '2025-06-25',
        }),
    { headers },
);

// 2. Customer chọn slot với tư vấn viên
const appointment = await fetch('/appointments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        serviceIds: ['nutrition-consultation-uuid'],
        consultantId: slots.data.availableSlots[0].consultant.id,
        appointmentDate: slots.data.availableSlots[0].dateTime,
        appointmentLocation: 'ONLINE',
    }),
});
// 3. Validate chuyên môn và availability
// 4. Appointment được tạo với status PENDING
// 5. Tạo chat room tự động
```

#### Flow 3: Dịch vụ hỗn hợp (Lab Test + Consultation)

**Status**: ✅ **FULLY IMPLEMENTED**

```javascript
// 1. Customer chọn serviceIds (mixed services)
const slots = await fetch(
    '/appointments/available-slots?' +
        new URLSearchParams({
            serviceIds: ['blood-test-uuid', 'nutrition-consultation-uuid'],
            startDate: '2025-06-25',
        }),
    { headers },
);

// 2. Customer chọn slot với tư vấn viên cho phần consultation
const appointment = await fetch('/appointments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        serviceIds: ['blood-test-uuid', 'nutrition-consultation-uuid'],
        consultantId: slots.data.availableSlots[0].consultant.id,
        appointmentDate: slots.data.availableSlots[0].dateTime,
        appointmentLocation: 'OFFICE',
    }),
});
// 3. Appointment được tạo bao gồm cả hai loại dịch vụ
// 4. Tạo chat room cho phần consultation
```

#### Flow 4: Optional Consultant Assignment

**Status**: ✅ **FULLY IMPLEMENTED**

```javascript
// 1. Customer chọn serviceIds (non-consultation services)
// 2. Có thể chọn consultantId nếu muốn có tư vấn viên theo dõi
const appointment = await fetch('/appointments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        serviceIds: ['health-checkup-uuid'],
        consultantId: 'optional-consultant-uuid', // Optional
        appointmentDate: '2025-06-25T14:00:00Z',
        appointmentLocation: 'OFFICE',
    }),
});
// 3. Không validate chuyên môn nghiêm ngặt
```

### 🏥 **Attendance Management Flows** (✅ All Implemented)

#### Flow 5: Normal Check-in Process

**Status**: ✅ **FULLY IMPLEMENTED**

```javascript
// 1. Bệnh nhân đến cơ sở y tế
// 2. Staff check-in qua API
const checkInResult = await fetch('/appointments/appointment-id/check-in', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        checkInTime: new Date(),
        notes: 'Patient arrived on time',
        actualServices: ['blood-test-uuid'], // Optional
    }),
});
// 3. System cập nhật status thành CHECKED_IN
// 4. Gửi notification cho consultant và customer
// 5. Estimate waiting time và assign room (nếu có)
```

#### Flow 6: No-show Detection and Processing

**Status**: ✅ **FULLY IMPLEMENTED** (with automation + refund)

```javascript
// Manual marking by staff
const noShowResult = await fetch('/appointments/appointment-id/mark-no-show', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        reason: 'Patient did not arrive and could not be contacted',
        contactAttempts: 3,
        notes: 'Called 3 times, no answer',
    }),
});
// Response includes refund processing result (usually 100% penalty)

// Auto Detection: Cron job chạy mỗi 15 phút phát hiện no-show
// System tự động áp dụng penalty và gửi notification
// Release resources và update availability
```

#### Flow 7: Late Arrival Processing

**Status**: ✅ **FULLY IMPLEMENTED** (with progressive penalty)

```javascript
// Bệnh nhân đến trễ, staff xử lý
const lateCheckIn = await fetch('/appointments/appointment-id/late-check-in', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        actualArrivalTime: new Date(), // 45 minutes late
        notes: 'Patient arrived late due to traffic',
        adjustedServices: ['consultation-uuid'], // Optional: if services changed
    }),
});

// Response includes warnings and refund processing based on delay:
// {
//   "success": true,
//   "data": {
//     "appointmentId": "123",
//     "actualArrivalTime": "2025-06-25T10:45:00Z",
//     "estimatedWaitTime": 25,
//     "status": "CHECKED_IN",
//     "warnings": [
//       "Bạn đã đến trễ 45 phút",
//       "Thời gian tư vấn có thể bị rút ngắn do đến trễ",
//       "Phí phạt 25% đã được áp dụng"
//     ],
//     "refund": {
//       "penaltyAmount": 125000,
//       "refundAmount": 375000
//     }
//   }
// }
```

#### Flow 8: Automated Reminder System

**Status**: ✅ **FULLY IMPLEMENTED**

```javascript
// Cron job tự động chạy mỗi giờ
// Gửi reminder trước appointment 24h, 2h, 30 phút
// Email notifications với appointment details
// SMS notifications (nếu configured)

// Staff có thể xem upcoming appointments cần reminder:
const upcomingAppointments = await fetch(
    '/appointments?' +
        new URLSearchParams({
            fromDate: '2025-06-26',
            toDate: '2025-06-26',
            status: 'confirmed',
        }),
    { headers },
);
```

#### Flow 9: Cancellation with Refund Processing

**Status**: ✅ **FULLY IMPLEMENTED**

```javascript
// Customer hoặc staff cancel appointment
const cancelResult = await fetch('/appointments/appointment-id/cancel', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
        cancellationReason: 'Family emergency, cannot attend',
    }),
});

// Response includes automatic refund calculation:
// {
//   "success": true,
//   "data": {
//     "appointmentId": "123",
//     "status": "CANCELLED",
//     "cancellationReason": "Family emergency, cannot attend",
//     "refund": {
//       "originalAmount": 500000,
//       "penaltyAmount": 0,  // No penalty if > 24h notice
//       "refundAmount": 500000,
//       "refundStatus": "PENDING",
//       "refundReference": "MANUAL_1719312000000"
//     }
//   }
// }
```

## Key Features

### ✅ **Implemented Features**

#### Service Type Detection:

```typescript
// Trong Service entity
const needsConsultant = services.some((s) => s.requiresConsultant === true);

// Legacy support
const isConsultation = services.some(
    (s) => s.category.type === ServiceCategoryType.CONSULTATION,
);

// Final decision
const requiresConsultantValidation = needsConsultant || isConsultation;
```

#### Enhanced Validation:

- ✅ **Flexible consultant requirement**: Dựa trên `requiresConsultant` field
- ✅ **Specialty matching**: Chỉ kiểm tra cho services yêu cầu consultant
- ✅ **Mixed service support**: Xử lý được appointment có nhiều loại service
- ✅ **Backward compatibility**: Vẫn support logic cũ qua category type

#### Attendance Management Features:

- ✅ **Auto Late Appointment Processing**: Cron job mỗi 15 phút - Tự động hủy lịch hẹn sau 60 phút
- ✅ **Reminder System**: Cron job gửi reminder định kỳ (24h/2h/30min trước)
- ✅ **Penalty System**: Áp dụng phí phạt cho no-show/late/cancellation
- ✅ **Payment Refund Integration**: Tự động xử lý hoàn trả dựa trên business rules
- ✅ **Resource Management**: Tự động release slots khi hủy/no-show
- ✅ **Notification System**: Email cho tất cả attendance events
- ✅ **Late Check-in Processing**: Cho phép check-in trong vòng 60 phút với progressive penalty
- ✅ **Status Tracking**: Đầy đủ lifecycle từ booking đến completion/cancellation

#### Payment Refund Features:

- ✅ **Automated Refund Processing**: Tự động xử lý refund cho cancel/no-show/late
- ✅ **Progressive Penalty System**: Penalty dựa trên thời gian cancel/late
- ✅ **Refund Calculation**: Tính toán chính xác refund amount và penalty
- ✅ **Payment Gateway Integration**: Sẵn sàng tích hợp với PayOS refund API
- ✅ **Refund Tracking**: Track refund status và reference

#### API Security & Access Control:

- ✅ **Role-based Authorization**: Phân quyền chi tiết theo role
- ✅ **JWT Authentication**: Bảo mật với JWT tokens
- ✅ **Data Validation**: Validation đầy đủ với class-validator
- ✅ **Error Handling**: Exception handling và logging
- ✅ **Consistent Response Format**: Standardized API response structure

### ⚠️ **Partial Features**

#### Dashboard & Analytics:

- ⚠️ **Staff Dashboard**: Thiếu APIs cho daily dashboard
- ⚠️ **Attendance Analytics**: Thiếu reporting chi tiết
- ⚠️ **Performance Metrics**: Thiếu KPI tracking

#### Payment Gateway Integration:

- ⚠️ **PayOS Refund API**: Chưa có official refund API (manual processing)
- ⚠️ **Real-time Refund Status**: Chưa có webhook cho refund status updates
- ⚠️ **Dynamic Pricing**: Chưa có pricing dựa trên demand

### ❌ **Missing Features**

#### External Integrations:

- ❌ **HMS Integration**: Hospital Management System
- ❌ **Queue Management**: Physical queue system
- ❌ **Calendar Sync**: Google Calendar, Outlook sync
- ❌ **SMS Gateway**: Professional SMS service

#### Advanced Business Logic:

- ❌ **Smart Scheduling**: AI-based slot recommendations
- ❌ **Capacity Management**: Room/resource optimization
- ❌ **Customer Loyalty Program**: Discount/penalty based on history

## Example Usage

### 📋 **Booking Examples**

#### Lab Test Only:

```javascript
const response = await fetch('/appointments', {
    method: 'POST',
    headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        serviceIds: ['blood-test-uuid', 'urine-test-uuid'],
        appointmentDate: '2025-06-25T09:00:00Z',
        appointmentLocation: 'OFFICE',
        notes: 'Fasting required for blood test',
        // consultantId không cần thiết
    }),
});

const result = await response.json();
// {
//   "success": true,
//   "message": "Appointment created successfully",
//   "data": { appointmentDetails }
// }
```

#### Consultation Only:

```javascript
// 1. Tìm available slots
const slotsResponse = await fetch(
    '/appointments/available-slots?' +
        new URLSearchParams({
            serviceIds: ['nutrition-consultation-uuid'],
            startDate: '2025-06-25',
        }),
    { headers },
);

const slotsData = await slotsResponse.json();

// 2. Đặt lịch với consultant
const appointmentResponse = await fetch('/appointments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        serviceIds: ['nutrition-consultation-uuid'],
        consultantId: slotsData.data.availableSlots[0].consultant.id,
        appointmentDate: slotsData.data.availableSlots[0].dateTime,
        appointmentLocation: 'ONLINE',
    }),
});
```

#### Mixed Services:

```javascript
const response = await fetch('/appointments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        serviceIds: ['blood-test-uuid', 'nutrition-consultation-uuid'],
        consultantId: 'selected-consultant-uuid', // Required vì có consultation
        appointmentDate: '2025-06-25T10:00:00Z',
        appointmentLocation: 'OFFICE',
    }),
});
```

### 🏥 **Attendance Management Examples**

#### Check-in Patient:

```javascript
const checkInResult = await fetch('/appointments/123/check-in', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        checkInTime: new Date(),
        notes: 'Patient arrived on time',
        actualServices: ['blood-test-uuid'], // Optional
    }),
});

const response = await checkInResult.json();
// {
//   "success": true,
//   "message": "Patient checked in successfully",
//   "data": {
//     "appointmentId": "123",
//     "checkInTime": "2025-06-25T09:00:00Z",
//     "estimatedWaitTime": 15,
//     "assignedRoom": "Room 101",
//     "nextSteps": ["Wait for nurse call", "Prepare for blood test"],
//     "status": "CHECKED_IN"
//   }
// }
```

#### Mark No-show:

```javascript
const noShowResult = await fetch('/appointments/123/mark-no-show', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        reason: 'Patient did not arrive and could not be contacted',
        contactAttempts: 2,
        notes: 'Called twice, no response',
    }),
});

const response = await noShowResult.json();
// {
//   "success": true,
//   "message": "Appointment marked as no-show successfully",
//   "data": {
//     "appointmentId": "123",
//     "reason": "Patient did not arrive and could not be contacted",
//     "notificationSent": true,
//     "status": "NO_SHOW",
//     "refund": {
//       "penaltyAmount": 500000,
//       "refundAmount": 0,
//       "refundStatus": "SUCCESS"
//     }
//   }
// }
```

#### Process Late Check-in:

```javascript
const lateCheckIn = await fetch('/appointments/123/late-check-in', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        actualArrivalTime: new Date(),
        notes: 'Patient arrived 45 minutes late - traffic jam',
        adjustedServices: ['consultation-uuid'], // Optional: if services changed
    }),
});

const response = await lateCheckIn.json();
// {
//   "success": true,
//   "message": "Late check-in processed successfully",
//   "data": {
//     "appointmentId": "123",
//     "actualArrivalTime": "2025-06-25T10:45:00Z",
//     "estimatedWaitTime": 25,
//     "status": "CHECKED_IN",
//     "warnings": [
//       "Bạn đã đến trễ 45 phút",
//       "Thời gian tư vấn có thể bị rút ngắn do đến trễ",
//       "Phí phạt 25% đã được áp dụng"
//     ],
//     "refund": {
//       "originalAmount": 500000,
//       "penaltyAmount": 125000,
//       "refundAmount": 375000,
//       "refundStatus": "PENDING"
//     }
//   }
// }
```

#### Cancel with Refund:

```javascript
const cancelResult = await fetch('/appointments/123/cancel', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
        cancellationReason: 'Family emergency, cannot attend',
    }),
});

const response = await cancelResult.json();
// {
//   "success": true,
//   "message": "Appointment cancelled successfully",
//   "data": {
//     "appointmentId": "123",
//     "status": "CANCELLED",
//     "cancellationReason": "Family emergency, cannot attend",
//     "refund": {
//       "originalAmount": 500000,
//       "penaltyAmount": 0, // No penalty if > 24h notice
//       "refundAmount": 500000,
//       "refundStatus": "PENDING",
//       "refundReference": "MANUAL_1719312000000"
//     }
//   }
// }
```

## Current Implementation Status

### ✅ **Production Ready**

- **Core Booking System**: Hoàn thiện và stable
- **Attendance Management**: Đầy đủ tính năng với automation
- **Payment Refund System**: Tự động xử lý hoàn trả
- **Notification System**: Email notifications working
- **Security & Access Control**: JWT + Role-based authorization
- **Data Validation**: Comprehensive validation với class-validator
- **API Documentation**: Swagger documentation available

### 🚧 **Development Priority**

1. **Staff Dashboard APIs** - Urgency: High
2. **Attendance Analytics** - Urgency: Medium
3. **PayOS Refund API Integration** - Urgency: Medium
4. **SMS Notifications** - Urgency: Low
5. **External System Integration** - Urgency: Future

### 📊 **System Metrics** (As of June 2025)

- **API Endpoints**: 13 implemented, 3 missing (dashboard APIs)
- **User Flows**: 9 fully implemented
- **Automation**: 2 cron jobs active (no-show detection, reminders)
- **Payment Integration**: Refund service implemented, ready for gateway integration
- **Test Coverage**: Service layer tests implemented
- **Documentation**: Comprehensive with frontend examples

### 💰 **Payment Refund Policy Summary**

| Scenario         | Timing            | Penalty | Refund           |
| ---------------- | ----------------- | ------- | ---------------- |
| **Cancellation** | 24+ hours before  | 0%      | 100%             |
| **Cancellation** | 2-24 hours before | 25%     | 75%              |
| **Cancellation** | < 2 hours before  | 50%     | 50%              |
| **Late Arrival** | 0-30 minutes      | 0%      | 100%             |
| **Late Arrival** | 30-45 minutes     | 15%     | 85%              |
| **Late Arrival** | 45-60 minutes     | 25%     | 75%              |
| **Late Arrival** | > 60 minutes      | 100%    | 0% (Auto-cancel) |
| **No-show**      | Any time          | 100%    | 0%               |

## Migration Notes

### ✅ **Completed Migrations**

- ✅ **Backward compatibility**: Legacy services hoạt động như cũ
- ✅ **Flexible consultant requirement**: Không còn hardcode yêu cầu consultant
- ✅ **Better UX**: Customer biết rõ khi nào cần chọn consultant
- ✅ **Admin control**: Admin có thể config service nào yêu cầu consultant
- ✅ **Attendance Management**: Hoàn toàn mới với đầy đủ automation
- ✅ **Status Management**: Bổ sung các status mới (CHECKED_IN, IN_PROGRESS)
- ✅ **Payment Refund Integration**: Tự động xử lý refund cho mọi scenario

### 🔄 **Ongoing Improvements**

- **Performance Optimization**: Index optimization cho query performance
- **Monitoring**: Adding metrics và health checks
- **Error Handling**: Enhanced error messages và recovery
- **Testing**: Expanding test coverage cho edge cases
- **PayOS Integration**: Waiting for official refund API

### 🎯 **Next Phase Goals**

1. **Staff Dashboard Implementation** (Q3 2025)
2. **Advanced Analytics Dashboard** (Q4 2025)
3. **PayOS Refund API Integration** (When available)
4. **External Systems Integration** (Q1 2026)
5. **Mobile App Support** (Q2 2026)

## Late Arrival Processing Workflow

### 🕐 **Updated Late Arrival Policy** (June 2025)

**Grace Period**: 60 minutes from scheduled appointment time
**Progressive Penalty**: Based on delay duration
**Auto-cancellation**: After 60 minutes with no check-in

### 📋 **Late Arrival Processing Flow**

#### Scenario 1: Arrival within 30 minutes ✅

```javascript
// Patient arrives 20 minutes late:
const result = await lateCheckIn(appointmentId, {
    actualArrivalTime: new Date(), // 20 min late
    notes: 'Traffic delay',
});
// Result: No penalty, 100% refund, status: CHECKED_IN
```

#### Scenario 2: Arrival 30-45 minutes late ⚠️

```javascript
// Patient arrives 35 minutes late:
const result = await lateCheckIn(appointmentId, {
    actualArrivalTime: new Date(), // 35 min late
    notes: 'Unexpected delay',
});
// Result: 15% penalty, 85% refund, status: CHECKED_IN
// Warning: "Consultation time may be reduced"
```

#### Scenario 3: Arrival 45-60 minutes late ⚠️⚠️

```javascript
// Patient arrives 50 minutes late:
const result = await lateCheckIn(appointmentId, {
    actualArrivalTime: new Date(), // 50 min late
    notes: 'Emergency delay',
});
// Result: 25% penalty, 75% refund, status: CHECKED_IN
// Warning: "Significant delay, service time will be reduced"
```

#### Scenario 4: Arrival after 60 minutes ❌

```javascript
// Patient arrives 70 minutes late:
// System auto-cancelled by cron job
// Manual check-in attempt will fail
// Status: CANCELLED, 100% penalty, 0% refund
```

### � **Business Impact Analysis**

#### Benefits of progressive penalty system:

- ✅ **Fair Treatment**: Progressive penalties instead of binary
- ✅ **Revenue Protection**: Appropriate penalties for resource waste
- ✅ **Clear Expectations**: Transparent penalty structure
- ✅ **Operational Efficiency**: Automated processing

#### Operational Considerations:

- ⚠️ **Staff Training**: Clear protocols for late arrival handling
- ⚠️ **Customer Communication**: Explain penalty policy clearly
- ⚠️ **Refund Processing**: Monitor refund status and handle failures
- ⚠️ **Schedule Management**: Adjust subsequent appointments for delays
