import {
    BadRequestException,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import {
    AppointmentStatusType,
    LocationTypeEnum,
    PaymentStatusType,
    RolesNameEnum,
} from 'src/enums';
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
     * Định nghĩa các bước chuyển trạng thái hợp lệ.
     * Key: Trạng thái hiện tại
     * Value: Mảng các trạng thái tiếp theo có thể chuyển đến
     */
    private readonly validTransitions: Partial<
        Record<AppointmentStatusType, AppointmentStatusType[]>
    > = {
        [AppointmentStatusType.PENDING]: [
            AppointmentStatusType.CONFIRMED,
            AppointmentStatusType.CANCELLED,
        ],
        [AppointmentStatusType.CONFIRMED]: [
            AppointmentStatusType.CHECKED_IN,
            AppointmentStatusType.CANCELLED,
        ],
        [AppointmentStatusType.CHECKED_IN]: [
            AppointmentStatusType.IN_PROGRESS,
            AppointmentStatusType.CANCELLED,
        ],
        [AppointmentStatusType.IN_PROGRESS]: [AppointmentStatusType.COMPLETED],
        [AppointmentStatusType.COMPLETED]: [],
        [AppointmentStatusType.CANCELLED]: [],
        [AppointmentStatusType.NO_SHOW]: [],
    };

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
        ].includes(user.role.name);

        if (!isOwner && !isConsultant && !isAdminOrManager) {
            throw new ForbiddenException(
                'Bạn không có quyền thực hiện hành động này với cuộc hẹn.',
            );
        }
    }

    /**
     * Kiểm tra xem một cuộc hẹn có thể bị hủy hay không dựa trên trạng thái hiện tại của nó.
     * @param appointment - Đối tượng cuộc hẹn cần kiểm tra.
     * @throws {BadRequestException} Nếu cuộc hẹn đã hoàn thành, đã bị hủy, hoặc đang diễn ra.
     */
    public validateCancellation(appointment: Appointment): void {
        const nonCancellableStatuses = [
            AppointmentStatusType.COMPLETED,
            AppointmentStatusType.CANCELLED,
            AppointmentStatusType.IN_PROGRESS,
        ];

        if (nonCancellableStatuses.includes(appointment.status)) {
            throw new BadRequestException(
                `Không thể hủy cuộc hẹn với trạng thái '${appointment.status}'.`,
            );
        }
    }

    /**
     * Kiểm tra xem việc chuyển từ trạng thái hiện tại sang trạng thái mới có hợp lệ không.
     * Nếu chuyển sang CONFIRMED và appointment là online thì phải có payment COMPLETED.
     * @param appointment - Đối tượng cuộc hẹn cần kiểm tra.
     * @param currentStatus - Trạng thái hiện tại của cuộc hẹn.
     * @param nextStatus - Trạng thái mới được yêu cầu.
     * @throws {BadRequestException} Nếu việc chuyển đổi không hợp lệ.
     */
    public validateStatusTransition(
        appointment: Appointment,
        currentStatus: AppointmentStatusType,
        nextStatus: AppointmentStatusType,
    ): void {
        // Nếu không có định nghĩa cho trạng thái hiện tại, hoặc trạng thái tiếp theo không nằm trong danh sách hợp lệ
        if (
            !this.validTransitions[currentStatus] ||
            !this.validTransitions[currentStatus].includes(nextStatus)
        ) {
            throw new BadRequestException(
                `Không thể chuyển trạng thái từ '${currentStatus}' sang '${nextStatus}'.`,
            );
        }

        // Nếu chuyển sang CONFIRMED và appointment là online thì phải có payment COMPLETED
        if (
            nextStatus === AppointmentStatusType.CONFIRMED &&
            appointment.appointmentLocation === LocationTypeEnum.ONLINE
        ) {
            const totalPaid = (appointment.payments || [])
                .filter((p) => p.status === PaymentStatusType.COMPLETED)
                .reduce((sum, p) => sum + Number(p.amount), 0);
            if (totalPaid < Number(appointment.fixedPrice)) {
                throw new BadRequestException(
                    `Lịch tư vấn online chỉ được xác nhận sau khi đã thanh toán đủ số tiền (${appointment.fixedPrice}). Hiện tại mới thanh toán: ${totalPaid}`,
                );
            }
        }
    }
}
