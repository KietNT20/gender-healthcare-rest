# STI Test Integration API Documentation

## Tổng quan

Module STI Test Integration cung cấp các API đơn giản để tích hợp quy trình xét nghiệm STI với hệ thống service. Mục đích chính là để người dùng có thể chọn dịch vụ xét nghiệm STI và tạo quy trình xét nghiệm một cách dễ dàng.

## 🔗 API Endpoints

### 1. Tạo STI Test Process từ Service Selection

**Endpoint:** `POST /sti-test-processes/booking/from-service-selection`

**Mô tả:** Tạo quy trình xét nghiệm STI từ việc chọn dịch vụ

**Request Body:**

```json
{
    "patientId": "123e4567-e89b-12d3-a456-426614174000",
    "serviceIds": ["123e4567-e89b-12d3-a456-426614174000"],
    "appointmentId": "123e4567-e89b-12d3-a456-426614174000", // Optional
    "consultantDoctorId": "123e4567-e89b-12d3-a456-426614174000", // Optional
    "notes": "Patient prefers morning appointment" // Optional
}
```

**Response:**

```json
{
  "stiTestProcesses": [
    {
      "id": "process-id",
      "testCode": "STI123456",
      "status": "ordered",
      "patient": { ... },
      "service": { ... },
      "estimatedResultDate": "2024-01-18T10:00:00Z"
    }
  ],
  "estimatedCost": 500000,
  "estimatedDuration": "3-5 ngày"
}
```

### 2. Lấy Available STI Services

**Endpoint:** `GET /sti-test-processes/services/available`

**Mô tả:** Lấy danh sách tất cả STI services có sẵn

**Response:**

```json
[
    {
        "id": "service-id",
        "name": "HIV Test",
        "description": "HIV antibody test",
        "price": 200000,
        "duration": 30,
        "category": {
            "id": "category-id",
            "name": "STI Tests",
            "type": "test"
        }
    }
]
```

### 3. Lấy STI Services từ Package

**Endpoint:** `GET /sti-test-processes/services/package/:packageId`

**Mô tả:** Lấy danh sách STI services có trong một package (placeholder)

**Response:**

```json
["service-id-1", "service-id-2"]
```

## 📊 Statistics API Endpoints

### 1. Dashboard Statistics

**Endpoint:** `GET /sti-test-processes/statistics/dashboard`

**Mô tả:** Lấy thống kê tổng quan cho dashboard

**Response:**

```json
{
    "total": 150,
    "byStatus": {
        "ordered": 25,
        "sample_collection_scheduled": 15,
        "sample_collected": 20,
        "processing": 30,
        "result_ready": 25,
        "result_delivered": 20,
        "completed": 15
    },
    "bottlenecks": ["Đang xử lý"],
    "avgDurationByStep": {
        "processing": 48
    }
}
```

### 2. Statistics by Period

**Endpoint:** `GET /sti-test-processes/statistics/period?startDate=2024-01-01&endDate=2024-01-31`

**Mô tả:** Lấy thống kê theo khoảng thời gian

### 3. Patient Statistics

**Endpoint:** `GET /sti-test-processes/statistics/patient/:patientId`

**Mô tả:** Lấy thống kê cho một bệnh nhân cụ thể

## 🔄 Workflow API Endpoints

### 1. Get Workflow Steps

**Endpoint:** `GET /sti-test-processes/workflow/steps`

**Mô tả:** Lấy danh sách tất cả các bước trong workflow

### 2. Get Next Steps

**Endpoint:** `GET /sti-test-processes/workflow/next-steps/:status`

**Mô tả:** Lấy các bước tiếp theo có thể thực hiện từ trạng thái hiện tại

### 3. Transition Status

**Endpoint:** `POST /sti-test-processes/:id/workflow/transition`

**Mô tả:** Chuyển đổi trạng thái với validation

**Request Body:**

```json
{
    "newStatus": "sample_collected",
    "validationData": {
        "sampleCollectedBy": "nurse-id",
        "sampleCollectionDate": "2024-01-15T10:00:00Z"
    }
}
```

## 🛡️ Validation Rules

### Service Selection Validation

- Phải có `patientId`
- Phải có `serviceIds` với ít nhất 1 service
- Tất cả services phải là STI tests
- System tự động validate service type

### STI Service Identification

Service được coi là STI test nếu:

- Category type là "test"
- Tên hoặc mô tả chứa từ khóa: `sti`, `std`, `sexually transmitted`, `hiv`, `syphilis`, `gonorrhea`, `chlamydia`, `herpes`, `hpv`, `hepatitis b`, `hepatitis c`

## 🔧 Integration Flow

### Flow: Service Selection to STI Test

1. User chọn STI services từ danh sách available
2. System validate tất cả services là STI tests
3. System tạo STI test processes cho từng service
4. Return booking response với cost và duration

## 📈 Error Handling

### Common Error Responses

**400 Bad Request:**

```json
{
    "message": "Cần chọn ít nhất một service",
    "error": "Bad Request",
    "statusCode": 400
}
```

**400 Bad Request (Validation):**

```json
{
    "message": "Service service-id không phải là xét nghiệm STI",
    "error": "Bad Request",
    "statusCode": 400
}
```

**404 Not Found:**

```json
{
    "message": "Không tìm thấy bệnh nhân",
    "error": "Not Found",
    "statusCode": 404
}
```

## 🔐 Authentication & Authorization

- Tất cả endpoints yêu cầu JWT authentication
- Role-based access control:
    - `CUSTOMER`: Có thể tạo booking và xem services
    - `STAFF/ADMIN/MANAGER`: Full access

## 📝 Notes

- **Đơn giản hóa**: Service chỉ tập trung vào việc identify STI services và tạo processes
- **Tự động validation**: System tự động kiểm tra service có phải STI test không
- **Flexible**: Có thể mở rộng để tích hợp với appointment system sau này
- **Statistics**: Hỗ trợ real-time dashboard cho admin/staff
- **Workflow**: Quản lý trạng thái với validation đầy đủ
