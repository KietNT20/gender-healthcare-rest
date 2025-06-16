import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>;

    async connectToRedis(): Promise<void> {
        const host = process.env.REDIS_HOST;
        const port = 6379;
        const password = process.env.REDIS_PASSWORD;
        const pubClient = createClient({
            socket: {
                host,
                port,
                connectTimeout: 30000,
                reconnectStrategy: (retries) => {
                    const delay = Math.min(retries * 200, 5000);
                    console.log(
                        `Redis reconnect attempt ${retries}, delay: ${delay}ms`,
                    );
                    return delay;
                },
                tls: process.env.NODE_ENV === 'production' ? true : false,
            },
            username: 'default',
            password: password,
            database: 0,
        });
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);

        this.adapterConstructor = createAdapter(pubClient, subClient);
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }
}
