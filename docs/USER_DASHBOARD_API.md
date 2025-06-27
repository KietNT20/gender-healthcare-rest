# User Dashboard API Documentation

## Tổng quan về User Dashboard APIs

Tài liệu này mô tả các API endpoints cho việc thống kê và báo cáo user dashboard trong hệ thống gender healthcare.

## 📊 **Các API Endpoints mới**

### 1. **Thống kê User Active theo Khoảng thời gian**

**Endpoint:** `GET /user-dashboard/stats/active-by-period`

**Mô tả:** Trả về thống kê user active (customer và consultant) theo khoảng thời gian (tháng, quý, năm)

**Query Parameters:**

```typescript
{
  periodType?: 'month' | 'quarter' | 'year' = 'month',    // Loại khoảng thời gian
  periodCount?: number = 12,                              // Số lượng kỳ cần lấy
  includeCurrentPeriod?: boolean = true                   // Có bao gồm kỳ hiện tại hay không
}
```

**Response:**

```typescript
Array<{
    month: string; // Nhãn thời gian (MM/YYYY, Q1/2025, 2025)
    customer: number; // Số customer active đăng ký trong kỳ
    consultant: number; // Số consultant active đăng ký trong kỳ
}>;
```

**Ví dụ sử dụng:**

- `GET /user-dashboard/stats/active-by-period?periodType=month&periodCount=6` - 6 tháng gần nhất
- `GET /user-dashboard/stats/active-by-period?periodType=quarter&periodCount=4` - 4 quý gần nhất
- `GET /user-dashboard/stats/active-by-period?periodType=year&periodCount=3&includeCurrentPeriod=false` - 3 năm trước (không tính năm hiện tại)

---

### 2. **So sánh với Kỳ trước**

**Endpoint:** `GET /user-dashboard/stats/active-comparison`

**Mô tả:** So sánh thống kê user active giữa kỳ hiện tại và kỳ trước (tháng trước, quý trước, năm trước)

**Query Parameters:**

```typescript
{
  periodType: 'month' | 'quarter' | 'year' = 'month'     // Loại khoảng thời gian để so sánh
}
```

**Response:**

```typescript
{
  current: {
    month: string;        // Nhãn kỳ hiện tại
    customer: number;     // Số customer active kỳ hiện tại
    consultant: number;   // Số consultant active kỳ hiện tại
  },
  previous: {
    month: string;        // Nhãn kỳ trước
    customer: number;     // Số customer active kỳ trước
    consultant: number;   // Số consultant active kỳ trước
  },
  growth: {
    customer: number;           // Tăng trưởng số tuyệt đối customer
    consultant: number;         // Tăng trưởng số tuyệt đối consultant
    customerPercent: number;    // Tăng trưởng % customer
    consultantPercent: number;  // Tăng trưởng % consultant
  }
}
```

**Ví dụ sử dụng:**

- `GET /user-dashboard/stats/active-comparison?periodType=month` - So sánh tháng này vs tháng trước
- `GET /user-dashboard/stats/active-comparison?periodType=quarter` - So sánh quý này vs quý trước
- `GET /user-dashboard/stats/active-comparison?periodType=year` - So sánh năm này vs năm trước

---

### 3. **Tổng User Active theo Role**

**Endpoint:** `GET /user-dashboard/stats/total-active-by-role`

**Mô tả:** Thống kê tổng số user active hiện tại theo từng role

**Response:**

```typescript
{
    customers: number; // Tổng customer active
    consultants: number; // Tổng consultant active
    staff: number; // Tổng staff active
    managers: number; // Tổng manager active
    admins: number; // Tổng admin active
    total: number; // Tổng tất cả user active
}
```

---

## 📋 **API Endpoints hiện có**

### 4. **Tổng quan Dashboard**

- `GET /user-dashboard/overview` - Tổng quan toàn bộ hệ thống

### 5. **Thống kê Customer**

- `GET /user-dashboard/customers` - Thống kê customer cơ bản
- `GET /user-dashboard/customers/period` - Thống kê customer theo khoảng thời gian

### 6. **Thống kê Consultant**

- `GET /user-dashboard/consultants` - Thống kê consultant cơ bản
- `GET /user-dashboard/consultants/period` - Thống kê consultant theo khoảng thời gian

### 7. **Thống kê khác**

- `GET /user-dashboard/stats/gender` - Thống kê theo giới tính
- `GET /user-dashboard/stats/registration-trend` - Xu hướng đăng ký 12 tháng

---

## 🔐 **Phân quyền**

Tất cả endpoints đều yêu cầu:

- **Authentication**: Bearer Token (JWT)
- **Authorization**: Chỉ ADMIN và MANAGER được truy cập

---

## 💡 **Ví dụ Response thực tế**

### Thống kê theo tháng (6 tháng gần nhất):

```json
[
    { "month": "01/2025", "customer": 45, "consultant": 12 },
    { "month": "02/2025", "customer": 52, "consultant": 15 },
    { "month": "03/2025", "customer": 38, "consultant": 8 },
    { "month": "04/2025", "customer": 67, "consultant": 20 },
    { "month": "05/2025", "customer": 73, "consultant": 18 },
    { "month": "06/2025", "customer": 81, "consultant": 22 }
]
```

### So sánh tháng hiện tại vs tháng trước:

```json
{
    "current": { "month": "06/2025", "customer": 81, "consultant": 22 },
    "previous": { "month": "05/2025", "customer": 73, "consultant": 18 },
    "growth": {
        "customer": 8,
        "consultant": 4,
        "customerPercent": 10.96,
        "consultantPercent": 22.22
    }
}
```

### Thống kê theo quý:

```json
[
    { "month": "Q1/2024", "customer": 135, "consultant": 35 },
    { "month": "Q2/2024", "customer": 158, "consultant": 43 },
    { "month": "Q3/2024", "customer": 178, "consultant": 46 },
    { "month": "Q4/2024", "customer": 201, "consultant": 60 },
    { "month": "Q1/2025", "customer": 235, "consultant": 55 },
    { "month": "Q2/2025", "customer": 221, "consultant": 60 }
]
```

---

## 🎯 **Use Cases**

### 1. **Dashboard Admin**

- Hiển thị tổng quan user active hiện tại
- Biểu đồ tăng trưởng theo tháng/quý/năm
- So sánh hiệu suất với kỳ trước

### 2. **Báo cáo Quản lý**

- Phân tích xu hướng đăng ký user
- Đánh giá hiệu quả marketing theo kỳ
- Lập kế hoạch phát triển

### 3. **Analytics**

- Dữ liệu cho biểu đồ và dashboard
- Export báo cáo định kỳ
- Theo dõi KPI

---

## ⚠️ **Lưu ý quan trọng**

1. **Chỉ đếm user `isActive: true`**: Tất cả thống kê chỉ tính user đang active
2. **Dựa trên `createdAt`**: Thống kê dựa trên ngày đăng ký của user
3. **Cache**: Nên implement caching cho các query thống kê để tối ưu performance
4. **Timezone**: Tất cả thời gian đều tính theo UTC, frontend cần convert sang local time

---

_Tài liệu này được cập nhật lần cuối: June 27, 2025_
