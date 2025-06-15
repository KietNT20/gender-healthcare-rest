import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createClient } from 'redis';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { User } from '../users/entities/user.entity';
import { ChatCleanupService } from './chat-cleanup.service';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Question } from './entities/question.entity';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsRoomAccessGuard } from './guards/ws-room-access.guard';
import { RedisWsThrottleGuard } from './guards/ws-throttle.guard';
import { RedisHealthService } from './redis-healthcheck.service';
import { RedisHelperService } from './redis-helper.service';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([User, Message, Question]),
        FilesModule,
        AuthModule,
    ],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService) => {
                const redisUrl =
                    configService.get('REDIS_URL') ||
                    `redis://${configService.get('REDIS_HOST', 'localhost')}:${configService.get('REDIS_PORT', 6379)}`;

                const client = createClient({
                    url: redisUrl,
                    socket: {
                        connectTimeout: 10000,
                        commandTimeout: 5000,
                        reconnectStrategy: (retries) =>
                            Math.min(retries * 50, 1000),
                    },
                    ...(configService.get('REDIS_PASSWORD') && {
                        password: configService.get('REDIS_PASSWORD'),
                    }),
                    ...(configService.get('REDIS_DB') && {
                        database: configService.get('REDIS_DB', 0),
                    }),
                });

                client.on('error', (err) => {
                    console.error('Redis Client Error:', err);
                });

                client.on('connect', () => {
                    console.log('Redis Client Connected');
                });

                client.on('ready', () => {
                    console.log('Redis Client Ready');
                });

                client.on('end', () => {
                    console.log('Redis Client Disconnected');
                });

                await client.connect();
                return client;
            },
            inject: [ConfigService],
        },
        ChatGateway,
        ChatService,
        ChatCleanupService,
        RedisHelperService,
        RedisHealthService,
        RedisWsThrottleGuard,
        WsJwtGuard,
        WsRoomAccessGuard,
    ],
    exports: [
        ChatGateway,
        ChatService,
        RedisHelperService,
        RedisHealthService,
        'REDIS_CLIENT',
    ],
})
export class ChatModule {}
