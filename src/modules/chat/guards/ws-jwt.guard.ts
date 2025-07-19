import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType() !== 'ws') {
            return true;
        }

        const client: Socket = context.switchToWs().getClient();
        const authHeader =
            client.handshake.headers.authorization ||
            (client.handshake.auth?.token as string);
        const token = authHeader?.split(' ')[1];

        this.logger.log(
            `Token: ${token} (Source: ${
                authHeader
                    ? 'Authorization Header'
                    : client.handshake.auth?.token
                      ? 'Auth Token'
                      : client.handshake.query?.token
                        ? 'Query Token'
                        : 'None'
            })`,
        );

        if (!token) {
            throw new WsException('No authentication token provided');
        }

        try {
            const user = await this.authService.verifyToken(token);

            if (!user) {
                throw new WsException('Invalid authentication token');
            }

            client.data.user = user;

            return true;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Invalid token';
            this.logger.error(
                `WebSocket Authentication Error: ${errorMessage}`,
            );
            throw new WsException(errorMessage);
        }
    }
}
