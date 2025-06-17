import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ChatService } from '../chat.service';

@Injectable()
export class WsRoomAccessGuard implements CanActivate {
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
                data.questionId,
                client.user.id,
            );

            if (!hasAccess) {
                throw new WsException({
                    success: false,
                    message: 'Access denied to this question',
                    questionId: data.questionId,
                });
            }

            return true;
        } catch (error) {
            throw new WsException({
                success: false,
                message: error.message || 'Access verification failed',
                questionId: data.questionId,
            });
        }
    }
}
