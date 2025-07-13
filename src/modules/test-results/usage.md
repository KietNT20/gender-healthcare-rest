# Hướng dẫn sử dụng TestResultExportPdfService

## Tổng quan

Service này cung cấp chức năng xuất PDF báo cáo y tế bằng tiếng Việt, bao gồm:

- Báo cáo kết quả xét nghiệm
- Báo cáo tư vấn khám bệnh
- Báo cáo kết quả xét nghiệm STI

## Các phương thức có sẵn

### 1. generateTestResultPdf()

Tạo PDF báo cáo kết quả xét nghiệm

```typescript
async generateTestResultPdf(
    id: string,
    currentUser: User,
): Promise<Buffer>
```

**Tham số:**

- `id`: ID của test result
- `currentUser`: Thông tin người dùng hiện tại

**Nội dung PDF:**

- Tiêu đề: "BÁO CÁO KẾT QUẢ XÉT NGHIỆM"
- Thông tin bệnh nhân
- Thông tin dịch vụ
- Chi tiết kết quả xét nghiệm
- Tóm tắt kết quả và khuyến nghị

### 2. generateConsultationPdf()

Tạo PDF báo cáo tư vấn khám bệnh

```typescript
async generateConsultationPdf(
    appointmentId: string,
    currentUser: User,
): Promise<Buffer>
```

**Tham số:**

- `appointmentId`: ID của appointment
- `currentUser`: Thông tin người dùng hiện tại

**Nội dung PDF:**

- Tiêu đề: "BÁO CÁO TƯ VẤN KHÁM BỆNH"
- Thông tin bệnh nhân
- Thông tin lịch hẹn
- Danh sách dịch vụ
- Ghi chú tư vấn
- Kết quả xét nghiệm (nếu có)

### 3. generateStiTestResultPdf()

Tạo PDF báo cáo kết quả xét nghiệm STI

```typescript
async generateStiTestResultPdf(
    stiProcessId: string,
    currentUser: User,
): Promise<Buffer>
```

**Tham số:**

- `stiProcessId`: ID của STI test process
- `currentUser`: Thông tin người dùng hiện tại

**Nội dung PDF:**

- Tiêu đề: "BÁO CÁO KẾT QUẢ XÉT NGHIỆM STI"
- Thông tin bệnh nhân
- Thông tin xét nghiệm
- Chi tiết lấy mẫu
- Kết quả xét nghiệm
- Ghi chú quá trình và phòng thí nghiệm
- Thông tin bác sĩ tư vấn

## Cách sử dụng trong Controller

```typescript
import { TestResultExportPdfService } from './services/test-result-export-pdf.service';

@Controller('test-results')
export class TestResultsController {
    constructor(
        private readonly testResultExportPdfService: TestResultExportPdfService,
    ) {}

    @Get(':id/export-pdf')
    async exportTestResultPdf(
        @Param('id') id: string,
        @CurrentUser() currentUser: User,
        @Res() res: Response,
    ) {
        const pdfBuffer =
            await this.testResultExportPdfService.generateTestResultPdf(
                id,
                currentUser,
            );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="ket-qua-xet-nghiem-${id}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    }

    @Get('consultation/:appointmentId/export-pdf')
    async exportConsultationPdf(
        @Param('appointmentId') appointmentId: string,
        @CurrentUser() currentUser: User,
        @Res() res: Response,
    ) {
        const pdfBuffer =
            await this.testResultExportPdfService.generateConsultationPdf(
                appointmentId,
                currentUser,
            );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="bao-cao-tu-van-${appointmentId}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    }

    @Get('sti/:stiProcessId/export-pdf')
    async exportStiTestResultPdf(
        @Param('stiProcessId') stiProcessId: string,
        @CurrentUser() currentUser: User,
        @Res() res: Response,
    ) {
        const pdfBuffer =
            await this.testResultExportPdfService.generateStiTestResultPdf(
                stiProcessId,
                currentUser,
            );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="ket-qua-sti-${stiProcessId}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    }
}
```

## Tính năng bảo mật

### Kiểm tra quyền truy cập:

- Người dùng chỉ có thể xem báo cáo của chính mình
- Admin và Staff có thể xem tất cả báo cáo
- Sử dụng enum `RolesNameEnum.ADMIN` và `RolesNameEnum.STAFF`

### Xử lý lỗi:

- `NotFoundException`: Khi không tìm thấy dữ liệu
- `ForbiddenException`: Khi không có quyền truy cập

## Định dạng PDF

### Font:

- Tự động chọn font hệ thống hỗ trợ tiếng Việt

### Kích thước font:

- Tiêu đề chính: 20pt
- Tiêu đề phụ: 16pt
- Nội dung: 12pt
- Footer: 10pt

### Định dạng ngày tháng:

- Ngày: DD/MM/YYYY
- Thời gian: HH:MM
- Sử dụng múi giờ Việt Nam

## Lưu ý khi triển khai

1. **Dependencies cần thiết:**

    ```bash
    npm install pdfkit
    npm install @types/pdfkit --save-dev
    ```

2. **Đăng ký service trong module:**

    ```typescript
    @Module({
        providers: [TestResultExportPdfService],
        exports: [TestResultExportPdfService],
    })
    export class TestResultsModule {}
    ```

3. **Xử lý memory cho file lớn:**
    - Service sử dụng stream để xử lý PDF
    - Phù hợp cho các báo cáo có dung lượng lớn

4. **Tùy chỉnh thêm:**
    - Có thể thêm logo công ty
    - Tùy chỉnh header/footer
    - Thêm watermark nếu cần

## Ví dụ tên file PDF được tạo:

- `ket-qua-xet-nghiem-{id}.pdf`
- `bao-cao-tu-van-{appointmentId}.pdf`
- `ket-qua-sti-{stiProcessId}.pdf`
