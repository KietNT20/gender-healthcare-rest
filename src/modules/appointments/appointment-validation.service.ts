import {
    BadRequestException,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { AppointmentStatusType, RolesNameEnum } from 'src/enums';
import { User } from 'src/modules/users/entities/user.entity';
import { Appointment } from './entities/appointment.entity';

/**
 * @class AppointmentValidationService
 * @description Chịu trách nhiệm xác thực các quy tắc nghiệp vụ và quyền truy cập
 * liên quan đến các cuộc hẹn.
 */
@Injectable()
export class AppointmentValidationService {
    /**
     * Kiểm tra xem người dùng hiện tại có quyền xem hoặc chỉnh sửa một cuộc hẹn cụ thể hay không.
     * @param appointment - Đối tượng cuộc hẹn cần kiểm tra.
     * @param user - Người dùng hiện tại đang thực hiện yêu cầu.
     * @throws {ForbiddenException} Nếu người dùng không có quyền truy cập.
     */
    public validateUserAccess(appointment: Appointment, user: User): void {
        const isOwner = appointment.user.id === user.id;
        const isConsultant = appointment.consultant?.id === user.id;
        const isAdminOrManager = [
            RolesNameEnum.ADMIN,
            RolesNameEnum.MANAGER,
        ].includes(user.role.name as RolesNameEnum);

        if (!isOwner && !isConsultant && !isAdminOrManager) {
            throw new ForbiddenException(
                'Bạn không có quyền thực hiện hành động này với cuộc hẹn.',
            );
        }
    }

    /**
     * Kiểm tra xem một cuộc hẹn có thể bị hủy hay không dựa trên trạng thái hiện tại của nó.
     * @param appointment - Đối tượng cuộc hẹn cần kiểm tra.
     * @throws {BadRequestException} Nếu cuộc hẹn đã hoàn thành hoặc đã bị hủy trước đó.
     */
    public validateCancellation(appointment: Appointment): void {
        if (
            appointment.status === AppointmentStatusType.COMPLETED ||
            appointment.status === AppointmentStatusType.CANCELLED
        ) {
            throw new BadRequestException(
                'Không thể hủy cuộc hẹn đã hoàn thành hoặc đã bị hủy.',
            );
        }
    }
}
