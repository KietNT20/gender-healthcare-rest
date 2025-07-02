# STI Test Process Flow Documentation

## Tổng quan về Quy trình Xét nghiệm STI

Quy trình xét nghiệm STI (Sexually Transmitted Infections) là một quy trình được thiết kế để quản lý toàn bộ chu kỳ xét nghiệm từ khi đặt đơn cho đến khi hoàn thành điều trị và theo dõi.

## 🔄 Workflow States (Trạng thái Quy trình)

### 1. ORDERED (Đã đặt xét nghiệm)

- **Mô tả**: Đơn xét nghiệm STI đã được tạo và chờ lên lịch lấy mẫu
- **Yêu cầu**:
    - Thông tin bệnh nhân đầy đủ
    - Dịch vụ được chọn
- **Thời gian ước tính**: 0 giờ
- **Bước tiếp theo**:
    - `SAMPLE_COLLECTION_SCHEDULED` (Lên lịch lấy mẫu)
    - `CANCELLED` (Hủy bỏ)

### 2. SAMPLE_COLLECTION_SCHEDULED (Đã lên lịch lấy mẫu)

- **Mô tả**: Đã lên lịch cuộc hẹn để lấy mẫu xét nghiệm
- **Yêu cầu**:
    - Cuộc hẹn được đặt
    - Bệnh nhân xác nhận
- **Thời gian ước tính**: 24-48 giờ
- **Bước tiếp theo**:
    - `SAMPLE_COLLECTED` (Đã lấy mẫu)
    - `CANCELLED` (Hủy bỏ)

### 3. SAMPLE_COLLECTED (Đã lấy mẫu)

- **Mô tả**: Mẫu xét nghiệm đã được thu thập thành công
- **Yêu cầu**:
    - Mẫu chất lượng tốt
    - Thông tin người lấy mẫu
    - Nhãn mẫu chính xác
- **Thời gian ước tính**: 1 giờ
- **Bước tiếp theo**:
    - `PROCESSING` (Đang xử lý)

### 4. PROCESSING (Đang xử lý)

- **Mô tả**: Mẫu đang được phân tích tại phòng lab
- **Yêu cầu**:
    - Mẫu đã chuyển đến lab
    - Lab xác nhận nhận mẫu
- **Thời gian ước tính**: 24-72 giờ
- **Bước tiếp theo**:
    - `RESULT_READY` (Kết quả sẵn sàng)

### 5. RESULT_READY (Kết quả sẵn sàng)

- **Mô tả**: Kết quả xét nghiệm đã hoàn thành và chờ giao cho bệnh nhân
- **Yêu cầu**:
    - Kết quả đã được kiểm tra
    - Báo cáo hoàn thành
- **Thời gian ước tính**: 1 giờ
- **Bước tiếp theo**:
    - `RESULT_DELIVERED` (Đã giao kết quả)
    - `CONSULTATION_REQUIRED` (Cần tư vấn)

### 6. RESULT_DELIVERED (Đã giao kết quả)

- **Mô tả**: Kết quả đã được giao cho bệnh nhân
- **Yêu cầu**:
    - Bệnh nhân đã nhận kết quả
    - Xác nhận giao kết quả
- **Thời gian ước tính**: 0 giờ
- **Bước tiếp theo**:
    - `CONSULTATION_REQUIRED` (Cần tư vấn)
    - `FOLLOW_UP_SCHEDULED` (Lên lịch theo dõi)
    - `COMPLETED` (Hoàn thành)

### 7. CONSULTATION_REQUIRED (Cần tư vấn)

- **Mô tả**: Kết quả cần tư vấn thêm từ bác sĩ chuyên khoa
- **Yêu cầu**:
    - Bác sĩ tư vấn được chỉ định
    - Lịch tư vấn được sắp xếp
- **Thời gian ước tính**: 24-48 giờ
- **Bước tiếp theo**:
    - `FOLLOW_UP_SCHEDULED` (Lên lịch theo dõi)
    - `COMPLETED` (Hoàn thành)

### 8. FOLLOW_UP_SCHEDULED (Đã lên lịch theo dõi)

- **Mô tả**: Đã lên lịch các cuộc hẹn theo dõi cần thiết
- **Yêu cầu**:
    - Lịch theo dõi được xác nhận
    - Hướng dẫn điều trị
- **Thời gian ước tính**: 1 giờ
- **Bước tiếp theo**:
    - `COMPLETED` (Hoàn thành)

### 9. COMPLETED (Hoàn thành)

- **Mô tả**: Toàn bộ quy trình xét nghiệm STI đã hoàn thành
- **Yêu cầu**:
    - Tất cả bước đã hoàn thành
    - Bệnh nhân hài lòng
- **Thời gian ước tính**: 0 giờ
- **Bước tiếp theo**: Không có (trạng thái cuối)

### 10. CANCELLED (Đã hủy)

- **Mô tả**: Quy trình xét nghiệm đã bị hủy bỏ
- **Yêu cầu**:
    - Lý do hủy rõ ràng
    - Thông báo cho bệnh nhân
- **Thời gian ước tính**: 0 giờ
- **Bước tiếp theo**: Không có (trạng thái cuối)

---

## 📋 Loại Mẫu Xét nghiệm (Sample Types)

| Loại     | Tên       | Mô tả                                   |
| -------- | --------- | --------------------------------------- |
| `BLOOD`  | Máu       | Mẫu máu để xét nghiệm                   |
| `URINE`  | Nước tiểu | Mẫu nước tiểu                           |
| `SWAB`   | Tăm bông  | Mẫu tăm bông từ các vùng cần xét nghiệm |
| `SALIVA` | Nước bọt  | Mẫu nước bọt                            |
| `OTHER`  | Khác      | Các loại mẫu khác                       |

---

## 🚨 Độ Ưu tiên Xử lý (Priority Levels)

| Mức độ   | Tên         | Mô tả                          |
| -------- | ----------- | ------------------------------ |
| `NORMAL` | Bình thường | Xử lý theo thứ tự thông thường |
| `HIGH`   | Cao         | Ưu tiên xử lý trước            |
| `URGENT` | Khẩn cấp    | Xử lý ngay lập tức             |

---

## 🔗 Mối quan hệ và Dependencies

### Entities liên quan:

1. **User (Patient)** - Bệnh nhân thực hiện xét nghiệm
2. **User (Consultant Doctor)** - Bác sĩ tư vấn (nếu cần)
3. **Service** - Dịch vụ xét nghiệm được chọn
4. **Appointment** - Cuộc hẹn lấy mẫu
5. **TestResult** - Kết quả xét nghiệm

### Services Integration:

1. **StiTestProcessesService** - Core service quản lý quy trình
2. **StiTestWorkflowService** - Quản lý workflow và validation
3. **StiTestIntegrationService** - Tích hợp với service selection và booking
4. **NotificationsService** - Gửi thông báo cho bệnh nhân
5. **MailService** - Gửi email thông báo kết quả

### Workflow Validation:

- Mỗi bước chuyển đổi trạng thái đều có validation riêng
- ValidationDataDto chứa các field cần thiết cho từng bước
- Hệ thống kiểm tra điều kiện trước khi cho phép chuyển đổi

---

## 🔄 Workflow Diagram

```mermaid
graph TD
    A[ORDERED] --> B[SAMPLE_COLLECTION_SCHEDULED]
    A --> X[CANCELLED]
    B --> C[SAMPLE_COLLECTED]
    B --> X
    C --> D[PROCESSING]
    D --> E[RESULT_READY]
    E --> F[RESULT_DELIVERED]
    E --> G[CONSULTATION_REQUIRED]
    F --> G
    F --> H[FOLLOW_UP_SCHEDULED]
    F --> I[COMPLETED]
    G --> H
    G --> I
    H --> I
```

---

## 🎯 API Endpoints

### Quản lý STI Test Process

- `POST /sti-test-processes` - Tạo mới quy trình xét nghiệm
- `POST /sti-test-processes/search` - Tìm kiếm với điều kiện
- `GET /sti-test-processes/test-code/:testCode` - Lấy thông tin theo mã xét nghiệm
- `POST /sti-test-processes/patient/:patientId` - Lấy danh sách theo bệnh nhân
- `GET /sti-test-processes/:id` - Lấy chi tiết quy trình
- `PUT /sti-test-processes/:id` - Cập nhật thông tin quy trình
- `PATCH /sti-test-processes/:id/status` - Cập nhật trạng thái
- `DELETE /sti-test-processes/:id` - Xóa quy trình

### Workflow Management

- `GET /sti-test-processes/workflow/steps` - Lấy danh sách các bước workflow
- `GET /sti-test-processes/workflow/next-steps/:status` - Lấy các bước tiếp theo
- `POST /sti-test-processes/:id/workflow/transition` - Chuyển đổi trạng thái với validation

### Integration và Booking

- `POST /sti-test-processes/booking/from-service-selection` - Tạo STI test từ việc chọn dịch vụ
- `GET /sti-test-processes/services/available` - Lấy danh sách STI services có sẵn
- `GET /sti-test-processes/services/package/:packageId` - Lấy STI services từ package

### Thống kê và Báo cáo

- `GET /sti-test-processes/statistics/dashboard` - Thống kê cho dashboard
- `GET /sti-test-processes/statistics/period` - Thống kê theo khoảng thời gian
- `GET /sti-test-processes/statistics/patient/:patientId` - Thống kê theo bệnh nhân

---

## 🔐 Phân quyền Truy cập

### Roles có quyền truy cập:

- **ADMIN** - Toàn quyền
- **MANAGER** - Quản lý và giám sát
- **STAFF** - Thực hiện các thao tác thường ngày
- **CUSTOMER** - Khách hàng (quyền hạn chế)

### Quyền hạn cụ thể:

- **Tạo/Sửa/Xóa**: ADMIN, MANAGER, STAFF
- **Xem thông tin**:
    - ADMIN, MANAGER, STAFF: Xem tất cả
    - CUSTOMER: Chỉ xem thông tin của chính mình
- **Workflow transition**: ADMIN, MANAGER, STAFF
- **Thống kê**: ADMIN, MANAGER, STAFF
- **Booking STI test**: ADMIN, MANAGER, STAFF, CUSTOMER
- **Xem STI services**: ADMIN, MANAGER, STAFF, CUSTOMER

---

## 📊 Tracking và Monitoring

### Thông tin được theo dõi:

1. **Thời gian**:

    - `createdAt`, `updatedAt` - Thời gian tạo và cập nhật
    - `estimatedResultDate` - Thời gian dự kiến có kết quả
    - `actualResultDate` - Thời gian thực tế có kết quả
    - `sampleCollectionDate` - Thời gian lấy mẫu

2. **Người thực hiện**:

    - `sampleCollectedBy` - Người lấy mẫu
    - `labProcessedBy` - Phòng lab xử lý
    - `consultantDoctor` - Bác sĩ tư vấn

3. **Tracking Flags**:

    - `requiresConsultation` - Cần tư vấn hay không
    - `patientNotified` - Đã thông báo cho bệnh nhân
    - `resultEmailSent` - Đã gửi email kết quả
    - `isConfidential` - Thông tin bảo mật

4. **Metadata**:
    - `testCode` - Mã xét nghiệm duy nhất
    - `processNotes` - Ghi chú về quá trình
    - `labNotes` - Ghi chú từ lab
    - `sampleCollectionLocation` - Địa điểm lấy mẫu

### Báo cáo và Analytics:

- Thống kê theo thời gian xử lý
- Phân tích hiệu suất workflow
- Theo dõi chất lượng dịch vụ
- Báo cáo tuân thủ quy định
- Dashboard statistics với các metrics quan trọng

---

## ⚙️ Business Rules và Validation

### Quy tắc Chuyển đổi Trạng thái:

1. **ORDERED → SAMPLE_COLLECTION_SCHEDULED**: Cần có appointmentId
2. **SAMPLE_COLLECTION_SCHEDULED → SAMPLE_COLLECTED**: Cần có thông tin người lấy mẫu và thời gian
3. **SAMPLE_COLLECTED → PROCESSING**: Cần xác nhận chất lượng mẫu
4. **PROCESSING → RESULT_READY**: Cần có kết quả từ lab
5. **RESULT_READY → RESULT_DELIVERED**: Cần xác nhận giao kết quả
6. **Bất kỳ trạng thái nào → CANCELLED**: Cần lý do hủy rõ ràng

### STI Service Integration Rules:

- Chỉ các service có category type = 'test' mới được coi là STI test
- Service name/description phải chứa các từ khóa STI: 'sti', 'std', 'hiv', 'syphilis', 'gonorrhea', 'chlamydia', 'herpes', 'hpv', 'hepatitis b', 'hepatitis c'
- Service phải có trạng thái isActive = true

### Mã Test Code Generation:

- Format: `STI{timestamp}{random}` (ví dụ: STI123456ABC)
- Đảm bảo tính duy nhất trong hệ thống
- Tối đa 10 lần thử tạo mã mới nếu trùng

---

## ⚠️ Lưu ý quan trọng

1. **Bảo mật thông tin**: Tất cả thông tin xét nghiệm STI đều được đánh dấu confidential (`isConfidential = true`)
2. **Tuân thủ quy định**: Workflow tuân thủ các quy định y tế về xét nghiệm STI
3. **Thông báo bệnh nhân**: Hệ thống tự động thông báo cho bệnh nhân ở các bước quan trọng
4. **Backup dữ liệu**: Định kỳ sao lưu dữ liệu để đảm bảo an toàn
5. **Audit trail**: Ghi nhận tất cả các thay đổi để có thể truy vết
6. **Xóa Process**: Chỉ cho phép xóa khi trạng thái là ORDERED hoặc CANCELLED

---

_Tài liệu này được cập nhật lần cuối: June 27, 2025_
