import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createClient } from 'redis';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { User } from '../users/entities/user.entity';
import { ChatCleanupSchedulerService } from './chat-cleanup-scheduler.service';
import { ChatCleanupService } from './chat-cleanup.service';
import { ChatRoomCleanupService } from './chat-room-cleanup.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Question } from './entities/question.entity';
import { ChatPaymentGuard } from './guards/chat-payment.guard';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsRoomAccessGuard } from './guards/ws-room-access.guard';
import { RedisWsThrottleGuard } from './guards/ws-throttle.guard';
import {
    ConnectionHandler,
    MessageHandler,
    RoomHandler,
    TypingHandler,
} from './handlers';
import { RedisHealthService } from './redis-healthcheck.service';
import { RedisHelperService } from './redis-helper.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Message, Question]),
        FilesModule,
        AuthModule,
    ],
    controllers: [ChatController],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService) => {
                const host = configService.get('REDIS_HOST');
                const port = +configService.get('REDIS_PORT');
                const password = configService.get('REDIS_PASSWORD');

                const client = createClient({
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
                    },
                    password: password,
                });

                client.on('error', (err) => {
                    console.error('Redis Client Error:', err);
                });

                client.on('connect', () => {
                    console.log('Redis Client Connected to AWS ElastiCache');
                });

                client.on('ready', () => {
                    console.log('Redis Client Ready');
                });

                client.on('reconnecting', () => {
                    console.log('Redis Client Reconnecting...');
                });

                client.on('end', () => {
                    console.log('Redis Client Connection Ended');
                });

                try {
                    await client.connect();
                    console.log(
                        '✅ Successfully connected to AWS ElastiCache Redis',
                    );
                    return client;
                } catch (error) {
                    console.error('❌ Failed to connect to Redis:', error);
                    throw error;
                }
            },
            inject: [ConfigService],
        },
        ChatGateway,
        ChatService,
        ChatCleanupService,
        ChatRoomCleanupService,
        ChatCleanupSchedulerService,
        RedisHelperService,
        RedisHealthService,
        RedisWsThrottleGuard,
        WsJwtGuard,
        WsRoomAccessGuard,
        ChatPaymentGuard,
        ConnectionHandler,
        RoomHandler,
        MessageHandler,
        TypingHandler,
    ],
    exports: [ChatService, ChatRoomCleanupService],
})
export class ChatModule {}
