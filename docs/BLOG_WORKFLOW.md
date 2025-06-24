# Blog Workflow Documentation

## Tổng quan Workflow

Hệ thống blog có 2 luồng xử lý khác nhau tùy theo quyền của người dùng:

### 1. Workflow cho Admin/Manager (Quyền cao)

- **Tạo blog**: Có thể tự động publish ngay (autoPublish=true)
- **Direct Publish**: Có thể publish trực tiếp từ DRAFT mà không cần review
- **Bypass Review**: Không bắt buộc phải đi qua quy trình duyệt

### 2. Workflow cho Consultant (Quyền thường)

- **Tạo blog**: Chỉ có thể tạo ở trạng thái DRAFT
- **Submit for Review**: Phải gửi để Admin/Manager duyệt
- **Chờ phản hồi**: Nhận kết quả APPROVED/REJECTED/NEEDS_REVISION

## Các trạng thái Blog

| Status           | Mô tả                 | Người có thể thực hiện |
| ---------------- | --------------------- | ---------------------- |
| `DRAFT`          | Blog đang soạn thảo   | Tất cả users           |
| `PENDING_REVIEW` | Đang chờ duyệt        | Chỉ Consultant gửi lên |
| `APPROVED`       | Đã duyệt, chờ publish | Admin/Manager duyệt    |
| `REJECTED`       | Bị từ chối            | Admin/Manager từ chối  |
| `NEEDS_REVISION` | Cần chỉnh sửa         | Admin/Manager yêu cầu  |
| `PUBLISHED`      | Đã xuất bản           | Hiển thị công khai     |
| `ARCHIVED`       | Đã lưu trữ            | Không hiển thị nữa     |

## API Endpoints và Phân quyền

### 1. Tạo Blog

```
POST /blogs
```

**Body:**

```json
{
    "title": "Tiêu đề blog",
    "content": "Nội dung blog",
    "status": "DRAFT",
    "autoPublish": true, // Chỉ Admin/Manager
    "categoryId": "uuid",
    "tags": ["tag1", "tag2"]
}
```

**Quyền:** Admin, Manager, Consultant

- **Admin/Manager**: Có thể set `autoPublish=true` để publish ngay
- **Consultant**: Chỉ có thể tạo DRAFT

### 2. Submit cho Review

```
PATCH /blogs/:id/submit-review
```

**Quyền:** Consultant (với blog của mình), Admin, Manager
**Từ:** DRAFT → PENDING_REVIEW

### 3. Review Blog

```
PATCH /blogs/:id/review
```

**Body:**

```json
{
    "status": "APPROVED", // APPROVED | REJECTED | NEEDS_REVISION
    "rejectionReason": "Lý do từ chối", // required nếu REJECTED
    "revisionNotes": "Ghi chú sửa đổi" // required nếu NEEDS_REVISION
}
```

**Quyền:** Admin, Manager
**Từ:** PENDING_REVIEW → APPROVED/REJECTED/NEEDS_REVISION

### 4. Publish Blog (từ APPROVED)

```
PATCH /blogs/:id/publish
```

**Quyền:** Admin, Manager
**Từ:** APPROVED → PUBLISHED

### 5. Direct Publish (từ DRAFT)

```
PATCH /blogs/:id/direct-publish
```

**Quyền:** Admin, Manager
**Từ:** DRAFT → PUBLISHED
**Lưu ý:** Bỏ qua hoàn toàn quy trình review

### 6. Archive Blog

```
PATCH /blogs/:id/archive
```

**Quyền:** Admin, Manager
**Từ:** Bất kỳ → ARCHIVED

## Luồng xử lý theo Role

### Admin/Manager Workflow:

```
1. Tạo blog với autoPublish=true
   ↓
   PUBLISHED (Ngay lập tức)

HOẶC

1. Tạo blog (DRAFT)
   ↓
2. Direct publish
   ↓
   PUBLISHED

HOẶC (nếu muốn theo workflow review)

1. Tạo blog (DRAFT)
   ↓
2. Submit for review
   ↓
3. Review & approve
   ↓
4. Publish
   ↓
   PUBLISHED
```

### Consultant Workflow:

```
1. Tạo blog (DRAFT)
   ↓
2. Submit for review
   ↓
   PENDING_REVIEW
   ↓
3. Admin/Manager review
   ↓
   ├── APPROVED → Publish → PUBLISHED
   ├── REJECTED → Sửa đổi → DRAFT
   └── NEEDS_REVISION → Chỉnh sửa → DRAFT
```

## Thông báo (Notifications)

### Tự động gửi thông báo khi:

1. **Blog submitted**: Thông báo cho tác giả
2. **Blog approved**: Thông báo cho tác giả
3. **Blog rejected**: Thông báo cho tác giả + lý do
4. **Blog needs revision**: Thông báo cho tác giả + ghi chú
5. **Blog published**: Thông báo cho tác giả
6. **Blog archived**: Thông báo cho tác giả
7. **View milestone**: Khi đạt milestone lượt xem (100, 500, 1000...)

### Thông báo cho Admin:

- **Daily**: Báo cáo số blog pending review
- **Overdue**: Blog chờ duyệt quá 3 ngày
- **Weekly**: Thống kê blog activities

## Lưu ý Implementation

1. **Validation**: Kiểm tra quyền user trước khi cho phép actions
2. **Audit Trail**: Lưu lại ai đã review, publish, archive
3. **Slug Generation**: Tự động tạo slug unique từ title
4. **Tag Management**: Tự động tạo tag mới nếu chưa tồn tại
5. **View Tracking**: Tăng view count khi đọc blog published
6. **Image Management**: Sync images với blog content

## Migration Notes

Nếu upgrade từ version cũ:

- Các blog DRAFT có thể được chuyển thành auto-publishable cho Admin
- Cần cập nhật permissions trong database
- Review lại workflow notifications
