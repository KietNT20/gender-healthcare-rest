import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { LocationTypeEnum, PaymentStatusType } from 'src/enums';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { ChatService } from '../chat.service';

@Injectable()
export class ChatPaymentGuard implements CanActivate {
    constructor(private readonly chatService: ChatService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();
        const data = context.switchToWs().getData();
        const user = client.data.user;

        if (!user) {
            throw new WsException('User not authenticated');
        }

        const questionId = data.questionId as string;
        if (!questionId) {
            throw new WsException('Question ID is required');
        }

        try {
            // Kiểm tra thanh toán trước khi cho phép join room
            await this.validatePaymentForRoom(questionId);
            return true;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            throw new WsException(errorMessage);
        }
    }

    private async validatePaymentForRoom(questionId: string): Promise<void> {
        const question = await this.chatService.getQuestionById(questionId);

        if (question?.appointment) {
            const appointment = question.appointment;

            // Chỉ kiểm tra thanh toán cho cuộc hẹn online có tư vấn viên
            if (
                appointment.appointmentLocation === LocationTypeEnum.ONLINE &&
                appointment.consultant
            ) {
                // Validate fixed price
                const fixedPrice = this.validateAndParseNumber(
                    appointment.fixedPrice,
                    'appointment.fixedPrice',
                );

                const payments = appointment.payments || [];
                const totalPaid = payments
                    .filter(
                        (p: Payment) =>
                            p.status === PaymentStatusType.COMPLETED,
                    )
                    .reduce((sum: number, p: Payment) => {
                        const amount = this.validateAndParseNumber(
                            p.amount,
                            'payment.amount',
                        );
                        return sum + amount;
                    }, 0);

                if (totalPaid < fixedPrice) {
                    throw new Error(
                        'Bạn cần thanh toán đủ số tiền trước khi có thể tham gia phòng chat. ' +
                            `Số tiền cần thanh toán: ${fixedPrice}, đã thanh toán: ${totalPaid}`,
                    );
                }
            }
        }
    }

    /**
     * Validates and parses a number value, throwing an error if invalid
     * @param value - The value to validate and parse
     * @param fieldName - The name of the field for error messages
     * @returns The parsed number
     * @throws Error if the value is invalid, null, undefined, or NaN
     */
    private validateAndParseNumber(value: any, fieldName: string): number {
        // Check for null or undefined
        if (value === null || value === undefined) {
            throw new Error(`${fieldName} is required but was ${value}`);
        }

        // Convert to number
        const numValue = Number(value);

        // Check if the result is NaN
        if (isNaN(numValue)) {
            throw new Error(
                `${fieldName} must be a valid number, got: ${value}`,
            );
        }

        // Check if the value is negative
        if (numValue < 0) {
            throw new Error(
                `${fieldName} cannot be negative, got: ${numValue}`,
            );
        }

        return numValue;
    }
}
