import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(private readonly authService: AuthService) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        if (context.getType() !== 'ws') {
            return true;
        }

        const client: Socket = context.switchToWs().getClient();
        const authHeader = client.handshake.headers.authorization;
        const token =
            authHeader?.split(' ')[1] ||
            client.handshake.auth?.token ||
            client.handshake.query?.token;

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
            const user = this.authService.verifyToken(token);

            if (!user) {
                throw new WsException('Invalid authentication token');
            }

            client.data.user = user;

            return true;
        } catch (error) {
            this.logger.error(
                `WebSocket Authentication Error: ${error.message}`,
            );
            throw new WsException(error.message);
        }
    }
}
