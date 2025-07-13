import { ForbiddenException } from '@nestjs/common';

export class HealthDataConsentRequiredException extends ForbiddenException {
    constructor() {
        super(
            'Bạn cần đồng ý cho phép thu thập dữ liệu sức khỏe để sử dụng tính năng này',
        );
    }
}
