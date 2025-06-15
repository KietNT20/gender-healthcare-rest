import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client = context.switchToWs().getClient();
        const token =
            client.handshake.auth?.token || client.handshake.query?.token;

        if (!token) {
            throw new WsException('No authentication token provided');
        }

        try {
            const user = await this.authService.verifyTokenForWebSocket(token);
            if (!user) {
                throw new WsException('Invalid authentication token');
            }
            client.user = user;
            return true;
        } catch (error) {
            this.logger.error(
                `WebSocket Authentication Error: ${error.message}`,
            );
            throw new WsException(error.message);
        }
    }
}
