import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ERROR_MESSAGES } from '../../constants/messages';

@Injectable()
export class WsAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient();
            const token = this.extractTokenFromHeader(client);

            if (!token) {
                throw new WsException(ERROR_MESSAGES.AUTHENTICATION_REQUIRED);
            }

            const payload = await this.jwtService.verifyAsync(token);
            const user = payload.user;

            if (!user || !user.id) {
                throw new WsException(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
            }

            // Attach user data to socket
            client.data.user = user;
            client.data.userId = user.id;
            client.data.userRole = user.role;

            return true;
        } catch (error) {
            throw new WsException(
                error instanceof WsException
                    ? error.getError()
                    : ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
            );
        }
    }

    private extractTokenFromHeader(client: Socket): string | undefined {
        const auth =
            (client.handshake.auth?.token as string) ||
            (client.handshake.headers?.authorization as string);

        if (!auth) {
            return undefined;
        }

        if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
            return auth.substring(7);
        }

        return auth;
    }
}
