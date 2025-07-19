import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ChatService } from '../chat.service';

@Injectable()
export class WsRoomAccessGuard implements CanActivate {
    private readonly logger = new Logger(WsRoomAccessGuard.name);

    constructor(private readonly chatService: ChatService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client = context.switchToWs().getClient();
        const data = context.switchToWs().getData();

        // Check if user is authenticated
        if (!client.user) {
            throw new WsException('User not authenticated');
        }

        // Check if questionId is provided
        if (!data.questionId) {
            throw new WsException('Question ID is required');
        }

        try {
            // Verify user has access to this question
            const hasAccess = await this.chatService.verifyQuestionAccess(
                data.questionId as string,
                client.user.id as string,
            );

            if (!hasAccess) {
                this.logger.warn(
                    `Access denied: User ${client.user.id} (${client.user.role?.name}) attempted to access question ${data.questionId}`,
                );

                throw new WsException({
                    success: false,
                    message:
                        'Access denied to this question. Only the customer and assigned consultant can access this chat room.',
                    questionId: data.questionId,
                    code: 'ACCESS_DENIED',
                });
            }

            this.logger.log(
                `Access granted: User ${client.user.id} (${client.user.role?.name}) accessing question ${data.questionId}`,
            );

            return true;
        } catch (error) {
            this.logger.error(
                `Access verification failed for user ${client.user.id} on question ${data.questionId}: ${error.message}`,
            );

            throw new WsException({
                success: false,
                message: error.message || 'Access verification failed',
                questionId: data.questionId,
                code: 'VERIFICATION_FAILED',
            });
        }
    }
}
