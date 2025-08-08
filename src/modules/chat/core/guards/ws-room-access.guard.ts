import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ERROR_MESSAGES } from '../../constants/messages';
import { AuthenticatedSocket } from '../interfaces/socket.interface';
import { ChatCoreService } from '../services/chat-core.service';

@Injectable()
export class WsRoomAccessGuard implements CanActivate {
    constructor(private readonly chatCoreService: ChatCoreService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: AuthenticatedSocket = context
                .switchToWs()
                .getClient();
            const data = context.switchToWs().getData();

            if (!client.data.userId) {
                throw new WsException(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
            }

            const questionId = data.questionId as string;
            if (!questionId) {
                throw new WsException(ERROR_MESSAGES.INVALID_REQUEST);
            }

            const hasAccess = await this.chatCoreService.validateUserAccess(
                questionId,
                client.data.userId as string,
            );

            if (!hasAccess) {
                throw new WsException(ERROR_MESSAGES.ACCESS_DENIED);
            }

            return true;
        } catch (error) {
            throw new WsException(
                error instanceof WsException
                    ? error.getError()
                    : ERROR_MESSAGES.ACCESS_DENIED,
            );
        }
    }
}
