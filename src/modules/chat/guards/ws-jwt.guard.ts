import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const client: Socket = context.switchToWs().getClient<Socket>();
        const token = this.extractTokenFromSocket(client);

        if (!token) {
            throw new WsException('No token provided');
        }

        try {
            const payload = this.jwtService.verify(token);
            // Attach user to socket
            (client as any).user = payload;
            return true;
        } catch (error) {
            throw new WsException('Invalid token');
        }
    }

    private extractTokenFromSocket(client: Socket): string | null {
        // Extract from auth or query params
        return (
            client.handshake.auth?.token ||
            client.handshake.query?.token ||
            null
        );
    }
}
