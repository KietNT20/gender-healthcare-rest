# Hướng dẫn Customer đặt lịch tư vấn

## Quy trình đặt lịch cho Customer

Có 2 trường hợp đặt lịch:

### Trường hợp 1: Tư vấn tổng quát (không chọn dịch vụ cụ thể)

### Trường hợp 2: Tư vấn có dịch vụ cụ thể

### Bước 1: Tìm kiếm slot trống

```
POST /appointments/available-slots
```

**Request Body cho tư vấn tổng quát:**

```json
{
    "serviceIds": [], // Mảng rỗng hoặc không truyền
    "startDate": "2025-07-10",
    "endDate": "2025-07-17",
    "startTime": "08:00",
    "endTime": "18:00",
    "consultantId": "consultant-uuid" // Optional - có thể chọn tư vấn viên cụ thể
}
```

**Request Body cho tư vấn có dịch vụ cụ thể:**

```json
{
    "serviceIds": ["service-uuid-1", "service-uuid-2"],
    "startDate": "2025-07-10",
    "endDate": "2025-07-17",
    "startTime": "08:00",
    "endTime": "18:00",
    "consultantId": "consultant-uuid" // Optional
}
```

**Response cho tư vấn tổng quát:**

```json
{
    "availableSlots": [
        {
            "dateTime": "2025-07-10T09:00:00.000Z",
            "consultant": {
                "id": "consultant-uuid",
                "firstName": "John",
                "lastName": "Doe",
                "specialties": ["reproductive-health", "general-consultation"],
                "rating": 4.5,
                "consultationFee": 200000
            },
            "availabilityId": "availability-uuid",
            "remainingSlots": 2
        }
    ],
    "totalSlots": 15,
    "totalConsultants": 3,
    "message": "Tư vấn tổng quát - tất cả tư vấn viên đang hoạt động"
}
```

**Response cho tư vấn có dịch vụ cụ thể:**

```json
{
    "availableSlots": [
        {
            "dateTime": "2025-07-10T09:00:00.000Z",
            "consultant": {
                "id": "consultant-uuid",
                "firstName": "John",
                "lastName": "Doe",
                "specialties": ["reproductive-health"],
                "rating": 4.5,
                "consultationFee": 200000
            },
            "availabilityId": "availability-uuid",
            "remainingSlots": 2
        }
    ],
    "totalSlots": 15,
    "totalConsultants": 3
}
```

### Bước 2: Đặt lịch hẹn

```
POST /appointments
```

**Request Body cho tư vấn tổng quát:**

```json
{
    "serviceIds": [], // Mảng rỗng hoặc không truyền
    "consultantId": "consultant-uuid", // Bắt buộc - chọn từ available slots
    "appointmentDate": "2025-07-10T09:00:00.000Z",
    "appointmentLocation": "ONLINE",
    "notes": "Tư vấn tổng quát về sức khỏe phụ nữ"
}
```

**Request Body cho tư vấn có dịch vụ cụ thể:**

```json
{
    "serviceIds": ["service-uuid-1"],
    "consultantId": "consultant-uuid",
    "appointmentDate": "2025-07-10T09:00:00.000Z",
    "appointmentLocation": "ONLINE",
    "notes": "Cần tư vấn về sức khỏe sinh sản"
}
```

## Tư vấn tổng quát vs Tư vấn có dịch vụ cụ thể

### Tư vấn tổng quát (General Consultation)

- **Khi nào sử dụng**: Customer muốn tư vấn chung về sức khỏe mà chưa xác định rõ dịch vụ cụ thể
- **serviceIds**: Mảng rỗng `[]` hoặc không truyền
- **consultantId**: Bắt buộc - customer phải chọn tư vấn viên từ available slots
- **Giá**: Sử dụng `consultationFee` của tư vấn viên (phí tư vấn tổng quát)
- **Thời gian**: Mặc định 60 phút (theo `sessionDurationMinutes`)

### Tư vấn có dịch vụ cụ thể (Service-based Consultation)

- **Khi nào sử dụng**: Customer đã biết rõ dịch vụ cần tư vấn
- **serviceIds**: Mảng chứa các service ID cần tư vấn
- **consultantId**: Bắt buộc nếu service yêu cầu tư vấn viên
- **Giá**: Tính theo logic phức tạp (service price + consultation fee)
- **Chuyên môn**: Tư vấn viên phải có specialty phù hợp với service

### Xử lý trong hệ thống:

1. **Tìm available slots**:
    - Tư vấn tổng quát: Hiển thị tất cả tư vấn viên đang hoạt động
    - Tư vấn có dịch vụ: Chỉ hiển thị tư vấn viên có specialty phù hợp

2. **Tính giá**:
    - Tư vấn tổng quát: `consultationFee` cố định
    - Tư vấn có dịch vụ: Tính theo `calculateAppointmentPrice()`

3. **Validation**:
    - Tư vấn tổng quát: Chỉ cần validate consultant tồn tại và active
    - Tư vấn có dịch vụ: Validate cả specialty matching

## Cách hệ thống kiểm tra slot trống

### 1. Kiểm tra lịch làm việc tư vấn viên

- Từ bảng `ConsultantAvailability`:
    - `dayOfWeek`: Thứ trong tuần (0=Chủ nhật, 1=Thứ 2,...)
    - `startTime`, `endTime`: Giờ làm việc
    - `maxAppointments`: Số lượng appointment tối đa trong 1 slot
    - `isAvailable`: Có làm việc không

### 2. Tính toán slot thời gian

- Chia thời gian làm việc thành các slot 30 phút
- Ví dụ: 09:00-17:00 → 09:00, 09:30, 10:00, 10:30, ...

### 3. Kiểm tra slot đã đặt

- Đếm số appointment có status `PENDING` hoặc `CONFIRMED` trong slot đó
- So sánh với `maxAppointments` để biết còn chỗ trống không

### 4. Validate chuyên môn

- Kiểm tra `specialties` của tư vấn viên có phù hợp với service không
- Chỉ hiển thị tư vấn viên phù hợp

## Tối ưu hóa cho Customer Experience

### Frontend Implementation Tips:

1. **Calendar View**: Hiển thị lịch theo tuần/tháng với slot trống
2. **Real-time Updates**: Cập nhật slot trống theo thời gian thực
3. **Filter Options**: Lọc theo chuyên môn, giá, rating
4. **Auto-refresh**: Tự động làm mới mỗi 30 giây

### Backend Optimizations:

1. **Caching**: Cache available slots trong Redis
2. **Pagination**: Phân trang kết quả tìm kiếm
3. **Concurrent Booking**: Xử lý đặt lịch đồng thời
4. **Notification**: Thông báo khi có slot mới

## Error Handling

### Common Error Cases:

1. **Slot đã hết**: "Tư vấn viên đã hết lịch trống vào thời gian này"
2. **Chuyên môn không phù hợp**: "Tư vấn viên không có chuyên môn phù hợp"
3. **Service không cần tư vấn viên**: "Các dịch vụ được chọn không yêu cầu tư vấn viên"
4. **Tư vấn viên không hoạt động**: "Tư vấn viên này hiện không hoạt động"

## Database Schema

### ConsultantAvailability

```sql
CREATE TABLE consultant_availability (
    id UUID PRIMARY KEY,
    consultant_profile_id UUID,
    day_of_week INTEGER, -- 0=Sunday, 1=Monday, ...
    start_time TIME,     -- '09:00'
    end_time TIME,       -- '17:00'
    max_appointments INTEGER, -- Số appointment tối đa trong 1 slot
    is_available BOOLEAN
);
```

### Appointment

```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    user_id UUID,
    consultant_id UUID,
    consultant_availability_id UUID,
    appointment_date TIMESTAMP,
    status VARCHAR(50), -- PENDING, CONFIRMED, CANCELLED, COMPLETED
    -- ... other fields
);
```

## Performance Considerations

1. **Index**: Tạo index cho các truy vấn thường xuyên
2. **Connection Pool**: Sử dụng connection pool
3. **Query Optimization**: Tối ưu query với proper joins
4. **Rate Limiting**: Giới hạn số request tìm kiếm

## Testing Scenarios

1. **Slot trống**: Customer tìm và đặt slot trống thành công
2. **Slot đã hết**: Customer không thể đặt slot đã hết
3. **Concurrent booking**: Nhiều customer đặt cùng 1 slot
4. **Specialty mismatch**: Service không phù hợp với consultant
5. **Time validation**: Không thể đặt lịch trong quá khứ

## Ưu nhược điểm của từng loại tư vấn

### Tư vấn tổng quát

**Ưu điểm:**

- Đơn giản, dễ đặt lịch
- Không cần biết trước dịch vụ cụ thể
- Phù hợp cho tư vấn ban đầu
- Giá cố định, dễ tính toán

**Nhược điểm:**

- Có thể không chuyên sâu như tư vấn có dịch vụ cụ thể
- Tư vấn viên có thể cần chuyển hướng sau khi tư vấn

**Khi nào nên sử dụng:**

- Lần đầu tư vấn, chưa rõ vấn đề cụ thể
- Cần tư vấn tổng quan về sức khỏe
- Muốn được định hướng về dịch vụ phù hợp

### Tư vấn có dịch vụ cụ thể

**Ưu điểm:**

- Chuyên sâu, đúng chuyên môn
- Tư vấn viên được chọn theo specialty
- Tích hợp với dịch vụ cụ thể
- Có thể kết hợp nhiều dịch vụ

**Nhược điểm:**

- Phức tạp hơn trong việc chọn lựa
- Cần biết trước dịch vụ cần tư vấn
- Giá tính toán phức tạp hơn

**Khi nào nên sử dụng:**

- Đã xác định rõ vấn đề cần tư vấn
- Cần chuyên môn cụ thể
- Muốn kết hợp tư vấn với dịch vụ khác

## Frontend UX/UI Recommendations

### Cho tư vấn tổng quát:

```javascript
// Component: GeneralConsultationBooking.jsx
const GeneralConsultationBooking = () => {
    const [selectedDate, setSelectedDate] = useState();
    const [selectedConsultant, setSelectedConsultant] = useState();

    const searchAvailableSlots = async () => {
        const response = await api.post('/appointments/available-slots', {
            serviceIds: [], // Mảng rỗng cho tư vấn tổng quát
            startDate: selectedDate,
            endDate: getEndDate(selectedDate, 7), // 7 ngày
            startTime: '08:00',
            endTime: '18:00',
        });

        return response.data;
    };

    const bookAppointment = async (slot) => {
        await api.post('/appointments', {
            serviceIds: [], // Không có dịch vụ cụ thể
            consultantId: slot.consultant.id,
            appointmentDate: slot.dateTime,
            appointmentLocation: 'ONLINE',
            notes: 'Tư vấn tổng quát',
        });
    };

    return (
        <div>
            <h2>Đặt lịch tư vấn tổng quát</h2>
            <DatePicker onChange={setSelectedDate} />
            <ConsultantGrid consultants={availableConsultants} />
            <TimeSlotPicker slots={availableSlots} onSelect={bookAppointment} />
        </div>
    );
};
```

### Cho tư vấn có dịch vụ cụ thể:

```javascript
// Component: ServiceConsultationBooking.jsx
const ServiceConsultationBooking = () => {
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedDate, setSelectedDate] = useState();

    const searchAvailableSlots = async () => {
        const response = await api.post('/appointments/available-slots', {
            serviceIds: selectedServices.map((s) => s.id),
            startDate: selectedDate,
            endDate: getEndDate(selectedDate, 7),
            startTime: '08:00',
            endTime: '18:00',
        });

        return response.data;
    };

    return (
        <div>
            <h2>Đặt lịch tư vấn có dịch vụ</h2>
            <ServiceSelector
                services={availableServices}
                selectedServices={selectedServices}
                onChange={setSelectedServices}
            />
            <DatePicker onChange={setSelectedDate} />
            <ConsultantGrid
                consultants={availableConsultants}
                showSpecialties={true}
            />
            <TimeSlotPicker slots={availableSlots} onSelect={bookAppointment} />
        </div>
    );
};
```

### Unified Booking Flow:

```javascript
// Component: UnifiedBooking.jsx
const UnifiedBooking = () => {
    const [bookingType, setBookingType] = useState('general'); // 'general' | 'service'

    return (
        <div>
            <BookingTypeSelector
                value={bookingType}
                onChange={setBookingType}
                options={[
                    { value: 'general', label: 'Tư vấn tổng quát' },
                    { value: 'service', label: 'Tư vấn có dịch vụ cụ thể' },
                ]}
            />

            {bookingType === 'general' ? (
                <GeneralConsultationBooking />
            ) : (
                <ServiceConsultationBooking />
            )}
        </div>
    );
};
```
